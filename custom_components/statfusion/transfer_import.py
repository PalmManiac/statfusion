"""Prepare and verify validated cross-install statistics imports."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from .transfer_format import TransferPackage

_VALUE_FIELDS = {"state", "sum", "min", "max", "mean", "mean_weight", "last_reset"}


def prepare_transfer_rows(package: TransferPackage) -> list[dict[str, Any]]:
    """Create Recorder import rows without changing the exported values."""
    return [dict(row) for row in package.rows]


def verify_transfer_rows(
    package: TransferPackage, recorder_rows: list[dict[str, Any]]
) -> bool:
    """Confirm every exported hour and supported value is present unchanged."""
    by_start = {_as_utc(row["start"]): row for row in recorder_rows}
    for expected in package.rows:
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


def _as_utc(value: datetime | float | int) -> datetime:
    """Normalize datetime or Recorder epoch timestamps for comparison."""
    if isinstance(value, datetime):
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("Recorder timestamps must include a timezone.")
        return value.astimezone(UTC)
    return datetime.fromtimestamp(value, tz=UTC)
