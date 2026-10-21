"""Tests for the CPU-bound transformations dispatched to the HA executor."""

from datetime import UTC, datetime, timedelta

import pytest

from custom_components.statfusion.executor_work import (
    analyze_statistics,
    build_transfer_body,
    prepare_merge_work,
    verify_merge_work,
)
from custom_components.statfusion.merge_plan import MergePlanError
from custom_components.statfusion.models import StatisticSnapshot
from custom_components.statfusion.transfer_format import parse_transfer_package

_START = datetime(2026, 1, 1, tzinfo=UTC)


def _snapshot(statistic_id: str, first: datetime, last: datetime) -> StatisticSnapshot:
    return StatisticSnapshot(
        statistic_id=statistic_id,
        unit_of_measurement="kWh",
        unit_class="energy",
        has_mean=False,
        has_sum=True,
        first=first,
        last=last,
        sample_count=1,
        mean_type="0",
    )


def _row(hour: int, total: float, *, mean_weight: float | None = None) -> dict:
    row = {
        "start": _START + timedelta(hours=hour),
        "state": total,
        "sum": total,
    }
    if mean_weight is not None:
        row["mean_weight"] = mean_weight
    return row


def test_export_worker_returns_validated_transfer_json_bytes() -> None:
    body = build_transfer_body(
        "sensor.old_energy",
        {
            "unit_of_measurement": "kWh",
            "unit_class": "energy",
            "has_sum": True,
            "mean_type": 0,
        },
        [_row(0, 12.5)],
    )

    package = parse_transfer_package(body)

    assert isinstance(body, bytes)
    assert package.source["statistic_id"] == "sensor.old_energy"
    assert package.rows[0]["sum"] == 12.5


def test_analysis_worker_includes_full_history_collision_summary() -> None:
    source = _snapshot("sensor.old_energy", _START, _START + timedelta(hours=1))
    target = _snapshot("sensor.new_energy", _START, _START + timedelta(hours=1))

    result = analyze_statistics(source, target, [_row(0, 1)], [_row(0, 2)])

    assert result["overlap"]["count"] == 1
    assert result["overlap"]["first"] == _START.isoformat()
    assert len(result["overlap"]["fingerprint"]) == 64


def test_merge_worker_prepares_import_rows_and_verifies_result() -> None:
    source_rows = [_row(0, 10), _row(1, 20)]
    target_rows = [_row(1, 200), _row(2, 300)]
    plan, import_rows = prepare_merge_work(
        source_rows,
        target_rows,
        "target",
        1,
        None,
    )

    assert [row["sum"] for row in import_rows] == [10]
    assert isinstance(import_rows[0]["start"], datetime)
    assert verify_merge_work(plan, [_row(0, 10), *target_rows], target_rows, "target")
    assert not verify_merge_work(
        plan, [_row(0, 999), *target_rows], target_rows, "target"
    )


def test_merge_worker_rejects_a_collision_set_changed_since_analysis() -> None:
    with pytest.raises(MergePlanError, match="changed after analysis"):
        prepare_merge_work(
            [_row(0, 10)],
            [_row(0, 20)],
            "target",
            0,
            None,
        )
