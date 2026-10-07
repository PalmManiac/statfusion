"""Prepare and verify validated cross-install statistics imports."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from .merge_plan import MergePlan, build_merge_plan
from .transfer_format import TransferPackage

_VALUE_FIELDS = {"state", "sum", "min", "max", "mean", "mean_weight", "last_reset"}


def prepare_transfer_rows(package: TransferPackage) -> list[dict[str, Any]]:
    """Create Recorder import rows without changing the exported values."""
    return [dict(row) for row in package.rows]


def plan_transfer_import(
    package: TransferPackage,
    target_rows: list[dict[str, Any]],
    collision_resolution: str | None,
) -> MergePlan:
    """Plan a transfer while preserving explicit choices for shared hours."""
    return build_merge_plan(
        prepare_transfer_rows(package), target_rows, collision_resolution
    )


def verify_transfer_rows(
    package: TransferPackage, recorder_rows: list[dict[str, Any]]
) -> bool:
    """Confirm every exported hour and supported value is present unchanged."""
    return verify_transfer_data(list(package.rows), recorder_rows)


def verify_transfer_data(
    expected_rows: list[dict[str, Any]], recorder_rows: list[dict[str, Any]]
) -> bool:
    """Verify expected rows by timestamp and all exported statistic values."""
    by_start = {_as_utc(row["start"]): row for row in recorder_rows}
    for expected in expected_rows:
        actual = by_start.get(_as_utc(expected["start"]))
        if actual is None:
            return False
        for field in _VALUE_FIELDS:
            if field not in expected:
                continue
            left, right = expected[field], actual.get(field)
            if field == "last_reset":
                if left is None or right is None:
                    if left is not right:
                        return False
                elif _as_utc(left) != _as_utc(right):
                    return False
            elif left != right:
                return False
    return True


def rows_at_starts(
    rows: list[dict[str, Any]], starts: frozenset[datetime]
) -> list[dict[str, Any]]:
    """Select Recorder rows whose UTC hour starts are in a collision set."""
    return [row for row in rows if _as_utc(row["start"]) in starts]


def _as_utc(value: datetime | float | int) -> datetime:
    """Normalize datetime or Recorder epoch timestamps for comparison."""
    if isinstance(value, datetime):
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("Recorder timestamps must include a timezone.")
        return value.astimezone(UTC)
    return datetime.fromtimestamp(value, tz=UTC)
