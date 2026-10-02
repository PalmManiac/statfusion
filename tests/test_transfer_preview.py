"""Read-only compatibility checks for cross-installation imports."""

from datetime import UTC, datetime
from pathlib import Path

from custom_components.statfusion.models import StatisticSnapshot
from custom_components.statfusion.transfer_format import parse_transfer_package
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


def test_preview_blocks_exact_duplicate_hours() -> None:
    analysis, collisions = analyze_transfer_preview(
        _package(), _target(first=_START), [{"start": _START.timestamp()}]
    )

    assert analysis.decision.value == "blocked"
    assert collisions == 1
    assert "transfer_timestamp_collision" in {
        finding.code for finding in analysis.findings
    }


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
    preview_module = export_module.split("class StatisticsImportPreviewView", 1)[1]

    assert 'url = "/api/statfusion/import/preview"' in preview_module
    assert "requires_auth = True" in preview_module
    assert "@require_admin" in preview_module
    assert "parse_transfer_package" in preview_module
    assert "async_read_statistic_dataset" in preview_module
    assert "async_import_hourly_statistics" not in preview_module
