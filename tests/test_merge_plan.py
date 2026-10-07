"""Tests for explicit hourly overlap resolution."""

from datetime import UTC, datetime, timedelta

import pytest

from custom_components.statfusion.merge_plan import (
    MergePlanError,
    build_merge_plan,
    inspect_collisions,
)

_START = datetime(2026, 1, 1, tzinfo=UTC)


def _row(hour: int, value: float, *, mean_weight: float | None = None) -> dict:
    row = {"start": _START + timedelta(hours=hour), "sum": value, "state": value}
    if mean_weight is not None:
        row["mean_weight"] = mean_weight
    return row


def test_no_collisions_imports_all_source_hours_without_a_choice() -> None:
    source = [_row(0, 1), _row(1, 2)]

    plan = build_merge_plan(source, [_row(2, 3)], None)

    assert plan.collision_summary.count == 0
    assert plan.rows_to_import == tuple(source)
    assert plan.added_hours == 2
    assert plan.replaced_hours == 0


def test_target_choice_keeps_shared_hours_and_imports_only_missing_hours() -> None:
    source = [_row(0, 10), _row(1, 20)]
    target = [_row(1, 200), _row(2, 300)]

    plan = build_merge_plan(source, target, "target")

    assert [row["sum"] for row in plan.rows_to_import] == [10]
    assert plan.collision_summary.count == 1
    assert plan.added_hours == 1
    assert plan.replaced_hours == 0
    assert plan.preserved_target_hours == 1
    assert len(plan.collision_summary.fingerprint) == 64


def test_collision_fingerprint_changes_when_the_shared_hours_change() -> None:
    first = inspect_collisions([_row(0, 1)], [_row(0, 2)]).fingerprint
    second = inspect_collisions([_row(1, 1)], [_row(1, 2)]).fingerprint

    assert first != second


def test_source_choice_replaces_shared_hours_and_imports_missing_hours() -> None:
    source = [_row(0, 10), _row(1, 20)]
    target = [_row(1, 200), _row(2, 300)]

    plan = build_merge_plan(source, target, "source")

    assert [row["sum"] for row in plan.rows_to_import] == [10, 20]
    assert plan.added_hours == 1
    assert plan.replaced_hours == 1
    assert plan.preserved_target_hours == 0


def test_overlaps_require_an_explicit_keep_source_or_keep_target_choice() -> None:
    with pytest.raises(MergePlanError, match="Choose which statistic"):
        build_merge_plan([_row(0, 10)], [_row(0, 20)], None)


def test_source_overwrite_is_blocked_if_recorder_cannot_replace_mean_weight() -> None:
    source = [_row(0, 10, mean_weight=60)]
    target = [_row(0, 20, mean_weight=30)]

    summary = inspect_collisions(source, target)
    assert summary.source_overwrite_safe is False
    with pytest.raises(MergePlanError, match="mean weights"):
        build_merge_plan(source, target, "source")

    target_plan = build_merge_plan(source, target, "target")
    assert target_plan.rows_to_import == ()
