"""CPU-bound transformations that run in Home Assistant's executor."""

from __future__ import annotations

import json
from collections.abc import Mapping
from datetime import UTC, datetime
from typing import Any

from .analyzer import analyze_merge
from .merge_plan import MergePlan, MergePlanError, build_merge_plan, inspect_collisions
from .models import StatisticSnapshot
from .transfer_format import build_transfer_package


def build_transfer_body(
    statistic_id: str, metadata: Mapping[str, Any], rows: list[Mapping[str, Any]]
) -> bytes:
    """Build and serialize an export without blocking the event loop."""
    package = build_transfer_package(statistic_id, metadata, rows)
    return json.dumps(
        package, ensure_ascii=False, separators=(",", ":"), allow_nan=False
    ).encode("utf-8")


def analyze_statistics(
    source: StatisticSnapshot,
    target: StatisticSnapshot,
    source_rows: list[dict[str, Any]],
    target_rows: list[dict[str, Any]],
) -> dict[str, Any]:
    """Analyze metadata and compare complete hourly histories."""
    result = analyze_merge(source, target).as_dict()
    result["overlap"] = _collision_summary_dict(
        inspect_collisions(source_rows, target_rows)
    )
    return result


def prepare_merge_work(
    source_rows: list[dict[str, Any]],
    target_rows: list[dict[str, Any]],
    collision_resolution: str | None,
    expected_collision_count: int | None,
    expected_collision_fingerprint: str | None,
) -> tuple[MergePlan, list[dict[str, Any]]]:
    """Build a fresh merge plan and prepare its rows for Recorder import."""
    plan = build_merge_plan(source_rows, target_rows, collision_resolution)
    if (
        expected_collision_count is not None
        and expected_collision_count != plan.collision_summary.count
    ) or (
        expected_collision_fingerprint is not None
        and expected_collision_fingerprint != plan.collision_summary.fingerprint
    ):
        raise MergePlanError(
            "The overlapping hours changed after analysis. Run the "
            "compatibility check again before merging."
        )

    return plan, [_prepare_import_row(row) for row in plan.rows_to_import]


def verify_merge_work(
    plan: MergePlan,
    verified_rows: list[dict[str, Any]],
    target_rows: list[dict[str, Any]],
    collision_resolution: str | None,
) -> bool:
    """Verify imported rows and any target collisions that should be kept."""
    target_rows_by_start = {_row_start(row): row for row in verified_rows}
    imported_rows_match = all(
        _row_matches(source_row, target_rows_by_start.get(_row_start(source_row)))
        for source_row in plan.rows_to_import
    )
    preserved_target_collisions_match = (
        plan.collision_summary.count == 0
        or collision_resolution == "source"
        or all(
            _row_matches(
                target_row,
                target_rows_by_start.get(_row_start(target_row)),
            )
            for target_row in target_rows
            if _row_start(target_row) in plan.collision_summary.starts
        )
    )
    return imported_rows_match and preserved_target_collisions_match


def _collision_summary_dict(summary: Any) -> dict[str, Any]:
    """Serialize overlap details for the read-only compatibility preview."""
    return {
        "count": summary.count,
        "first": summary.first.isoformat() if summary.first else None,
        "last": summary.last.isoformat() if summary.last else None,
        "fingerprint": summary.fingerprint,
        "source_overwrite_safe": summary.source_overwrite_safe,
    }


def _row_start(row: dict[str, Any]) -> datetime:
    """Convert a recorder row's epoch start to an aware UTC timestamp."""
    start = row["start"]
    if isinstance(start, datetime):
        return start.astimezone(UTC)
    return datetime.fromtimestamp(start, tz=UTC)


def _prepare_import_row(row: dict[str, Any]) -> dict[str, Any]:
    """Keep recorder values unchanged and convert only the timestamp shape."""
    result = {
        key: value
        for key, value in row.items()
        if key
        in {
            "start",
            "last_reset",
            "state",
            "sum",
            "min",
            "max",
            "mean",
            "mean_weight",
        }
    }
    result["start"] = _row_start(row)
    if isinstance(result.get("last_reset"), (int, float)):
        result["last_reset"] = datetime.fromtimestamp(result["last_reset"], tz=UTC)
    return result


def _row_matches(source_row: dict[str, Any], target_row: dict[str, Any] | None) -> bool:
    """Check each copied field against the recorder's post-import result."""
    if target_row is None:
        return False
    return all(
        _equivalent_value(value, target_row.get(key))
        for key, value in source_row.items()
        if key in {"state", "sum", "min", "max", "mean", "mean_weight", "last_reset"}
    )


def _equivalent_value(left: Any, right: Any) -> bool:
    """Compare numeric recorder values while requiring exact timestamp values."""
    if isinstance(left, datetime):
        if isinstance(right, datetime):
            return left.astimezone(UTC) == right.astimezone(UTC)
        if isinstance(right, (float, int)):
            return left.astimezone(UTC) == datetime.fromtimestamp(right, tz=UTC)
        return False
    return left == right


__all__ = [
    "analyze_statistics",
    "build_transfer_body",
    "prepare_merge_work",
    "verify_merge_work",
]
