"""Build explicit plans for source/target timestamp collisions."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from hashlib import sha256
from typing import Any, Literal

CollisionResolution = Literal["source", "target"]


@dataclass(frozen=True, slots=True)
class CollisionSummary:
    """The exact shared hours and whether source values can safely replace them."""

    starts: frozenset[datetime]
    source_overwrite_safe: bool

    @property
    def count(self) -> int:
        """Return the number of shared hourly timestamps."""
        return len(self.starts)

    @property
    def first(self) -> datetime | None:
        """Return the earliest shared timestamp, if any."""
        return min(self.starts) if self.starts else None

    @property
    def last(self) -> datetime | None:
        """Return the latest shared timestamp, if any."""
        return max(self.starts) if self.starts else None

    @property
    def fingerprint(self) -> str:
        """Return a stable digest for the exact shared hourly timestamps."""
        timestamps = "\n".join(start.isoformat() for start in sorted(self.starts))
        return sha256(timestamps.encode()).hexdigest()


@dataclass(frozen=True, slots=True)
class MergePlan:
    """The source rows to import and the outcome counts for a merge."""

    rows_to_import: tuple[dict[str, Any], ...]
    collision_summary: CollisionSummary
    added_hours: int
    replaced_hours: int
    preserved_target_hours: int


class MergePlanError(ValueError):
    """Raised when a collision plan lacks a safe, explicit resolution."""


def inspect_collisions(
    source_rows: list[dict[str, Any]], target_rows: list[dict[str, Any]]
) -> CollisionSummary:
    """Find duplicate hour starts and test if Recorder can fully replace them.

    The supported Recorder import API updates values for an existing hour, but
    it does not update ``mean_weight`` on current Home Assistant versions. A
    source-wins choice is therefore safe only when that stored value already
    matches for every collision.
    """
    source_by_start = {_row_start(row): row for row in source_rows}
    target_by_start = {_row_start(row): row for row in target_rows}
    starts = frozenset(source_by_start.keys() & target_by_start.keys())
    source_overwrite_safe = all(
        _same_mean_weight(source_by_start[start], target_by_start[start])
        for start in starts
    )
    return CollisionSummary(starts, source_overwrite_safe)


def build_merge_plan(
    source_rows: list[dict[str, Any]],
    target_rows: list[dict[str, Any]],
    collision_resolution: CollisionResolution | None,
) -> MergePlan:
    """Plan missing-hour imports and explicitly selected collision updates."""
    summary = inspect_collisions(source_rows, target_rows)
    if summary.count and collision_resolution not in {"source", "target"}:
        raise MergePlanError(
            "Choose which statistic's values to keep for shared hours."
        )
    if collision_resolution not in {None, "source", "target"}:
        raise MergePlanError("Unsupported collision resolution.")
    if collision_resolution == "source" and not summary.source_overwrite_safe:
        raise MergePlanError(
            "Source values cannot replace these hours because Recorder cannot "
            "safely update their mean weights. Keep the target values instead."
        )

    target_starts = {_row_start(row) for row in target_rows}
    rows_to_import = tuple(
        row
        for row in source_rows
        if _row_start(row) not in target_starts or collision_resolution == "source"
    )
    collisions_replaced = (
        summary.count if collision_resolution == "source" else 0
    )
    return MergePlan(
        rows_to_import=rows_to_import,
        collision_summary=summary,
        added_hours=len(rows_to_import) - collisions_replaced,
        replaced_hours=collisions_replaced,
        preserved_target_hours=(
            summary.count if collision_resolution != "source" else 0
        ),
    )


def _row_start(row: dict[str, Any]) -> datetime:
    """Normalize Recorder hour starts to aware UTC datetimes."""
    start = row["start"]
    if isinstance(start, datetime):
        return start.astimezone(UTC)
    return datetime.fromtimestamp(start, tz=UTC)


def _same_mean_weight(source_row: dict[str, Any], target_row: dict[str, Any]) -> bool:
    """Avoid a partial source overwrite when HA cannot replace mean weights."""
    return source_row.get("mean_weight") == target_row.get("mean_weight")
