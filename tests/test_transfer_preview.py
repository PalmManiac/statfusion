"""Preview and safe import checks for cross-installation statistics."""

from dataclasses import replace
from datetime import UTC, datetime
from pathlib import Path

import pytest

from custom_components.statfusion.merge_plan import MergePlanError
from custom_components.statfusion.models import StatisticSnapshot
from custom_components.statfusion.transfer_format import parse_transfer_package
from custom_components.statfusion.transfer_import import (
    plan_transfer_import,
    prepare_transfer_rows,
    verify_transfer_data,
    verify_transfer_rows,
)
from custom_components.statfusion.transfer_preview import analyze_transfer_preview

_START = datetime(2024, 1, 1, tzinfo=UTC)


def _package():
    return parse_transfer_package(
        {
            "format": "statfusion-statistics",
            "format_version": 1,
            "exported_at": "2026-10-02T10:00:00+00:00",
            "source": {
                "statistic_id": "sensor.energy_total",
                "unit_of_measurement": "kWh",
                "unit_class": "energy",
                "has_sum": True,
                "has_mean": False,
                "mean_type": "0",
            },
            "rows": [
                {
                    "start": "2024-01-01T00:00:00+00:00",
                    "state": 10,
                    "sum": 10,
                }
            ],
        }
    )


def _target(*, first=_START.replace(day=2), unit_class="energy"):
    return StatisticSnapshot(
        statistic_id="sensor.energy_total",
        unit_of_measurement="kWh",
        unit_class=unit_class,
        has_mean=False,
        has_sum=True,
        first=first,
        last=first,
        sample_count=1,
        mean_type="0",
    )


def test_preview_allows_same_statistic_id_across_installations() -> None:
    analysis, collisions = analyze_transfer_preview(_package(), _target(), [])

    assert analysis.decision.value == "ready_for_review"
    assert not any(item.code == "same_statistic_id" for item in analysis.findings)
    assert collisions == 0


def test_preview_allows_exact_duplicate_hours_with_a_review_warning() -> None:
    analysis, collisions = analyze_transfer_preview(
        _package(), _target(first=_START), [{"start": _START.timestamp()}]
    )

    assert analysis.decision.value == "ready_for_review"
    assert collisions == 1
    finding = next(
        finding for finding in analysis.findings
        if finding.code == "transfer_timestamp_collision"
    )
    assert finding.severity.value == "warning"


def test_preview_blocks_unit_class_mismatch_even_when_units_match() -> None:
    analysis, _collisions = analyze_transfer_preview(
        _package(), _target(unit_class="volume"), []
    )

    assert analysis.decision.value == "blocked"
    assert "unit_class_mismatch" in {finding.code for finding in analysis.findings}


def test_preview_http_endpoint_is_admin_only_and_read_only() -> None:
    export_module = Path("custom_components/statfusion/export.py").read_text(
        encoding="utf-8"
    )
    preview_module = export_module.split("class StatisticsImportPreviewView", 1)[
        1
    ].split("class StatisticsImportView", 1)[0]

    assert 'url = "/api/statfusion/import/preview"' in preview_module
    assert "requires_auth = True" in preview_module
    assert "@require_admin" in preview_module
    assert "parse_transfer_package" in preview_module
    assert "async_read_statistic_dataset" in preview_module
    assert "async_import_hourly_statistics" not in preview_module


def test_import_rows_preserve_exported_values_and_verify_recorder_rows() -> None:
    package = _package()
    rows = prepare_transfer_rows(package)
    assert rows == list(package.rows)
    assert verify_transfer_rows(package, [{**rows[0], "start": _START.timestamp()}])


def test_import_verification_rejects_missing_or_changed_rows() -> None:
    package = _package()
    row = prepare_transfer_rows(package)[0]
    assert not verify_transfer_rows(package, [])
    assert not verify_transfer_rows(package, [{**row, "sum": 11}])


def test_transfer_import_can_keep_destination_values_for_collisions() -> None:
    package = _package()
    target_rows = [{"start": _START.timestamp(), "state": 20, "sum": 20}]

    plan = plan_transfer_import(package, target_rows, "target")

    assert plan.collision_summary.count == 1
    assert plan.rows_to_import == ()
    assert plan.preserved_target_hours == 1
    assert verify_transfer_data(target_rows, target_rows)


def test_transfer_import_can_replace_collision_with_export_values() -> None:
    package = _package()
    target_rows = [{"start": _START.timestamp(), "state": 20, "sum": 20}]

    plan = plan_transfer_import(package, target_rows, "source")

    assert plan.rows_to_import == tuple(package.rows)
    assert plan.replaced_hours == 1
    assert plan.preserved_target_hours == 0
    assert verify_transfer_data(list(plan.rows_to_import), list(package.rows))


def test_transfer_import_requires_a_choice_when_hours_collide() -> None:
    package = _package()
    target_rows = [{"start": _START.timestamp(), "state": 20, "sum": 20}]

    with pytest.raises(MergePlanError, match="Choose which statistic"):
        plan_transfer_import(package, target_rows, None)


def test_transfer_cannot_replace_mean_rows_when_recorder_weights_differ() -> None:
    package = _package()
    package = replace(
        package,
        source={**package.source, "has_mean": True, "mean_type": "1"},
        rows=({**package.rows[0], "mean": 12, "mean_weight": 5},),
    )
    target_rows = [
        {
            "start": _START.timestamp(),
            "state": 20,
            "sum": 20,
            "mean": 14,
            "mean_weight": 4,
        }
    ]

    with pytest.raises(MergePlanError, match="cannot safely update their mean weights"):
        plan_transfer_import(package, target_rows, "source")


def test_import_endpoint_requires_confirmations_and_verifies_after_recorder_write() -> (
    None
):
    export_module = Path("custom_components/statfusion/export.py").read_text(
        encoding="utf-8"
    )
    import_view = export_module.split("class StatisticsImportView", 1)[1]

    assert 'url = "/api/statfusion/import"' in import_view
    assert "requires_auth = True" in import_view
    assert "@require_admin" in import_view
    assert "X-StatFusion-Backup-Confirmed" in import_view
    assert "X-StatFusion-Warnings-Confirmed" in import_view
    assert "X-StatFusion-Import-Confirmed" in import_view
    assert "analyze_transfer_preview" in import_view
    assert "expected_collision_count" in import_view
    assert "expected_collision_fingerprint" in import_view
    assert "plan_transfer_import" in import_view
    assert "collision_resolution" in import_view
    assert "async_import_hourly_statistics" in import_view
    assert "verify_transfer_data" in import_view
