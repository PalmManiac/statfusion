"""Read-only adapter for Home Assistant recorder statistics."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from homeassistant.components.recorder.statistics import (
    get_metadata,
    statistics_during_period,
)
from homeassistant.core import HomeAssistant

from .models import StatisticSnapshot

_ANALYSIS_START = datetime(1970, 1, 1, tzinfo=UTC)


async def async_read_statistic_snapshot(
    hass: HomeAssistant, statistic_id: str
) -> StatisticSnapshot:
    """Read metadata and hourly boundaries without modifying recorder data."""
    return await hass.async_add_executor_job(
        _read_statistic_snapshot, hass, statistic_id
    )


def _read_statistic_snapshot(
    hass: HomeAssistant, statistic_id: str
) -> StatisticSnapshot:
    """Read one statistic through the recorder's read-only helpers."""
    metadata_by_id = get_metadata(hass, statistic_ids={statistic_id})
    if statistic_id not in metadata_by_id:
        return StatisticSnapshot(
            statistic_id=statistic_id,
            unit_of_measurement=None,
            unit_class=None,
            has_mean=False,
            has_sum=False,
            first=None,
            last=None,
            sample_count=0,
        )

    metadata: dict[str, Any] = metadata_by_id[statistic_id][1]
    has_mean = bool(metadata["mean_type"])
    has_sum = bool(metadata["has_sum"])
    types = {"mean"} if has_mean else set()
    if has_sum:
        types.add("sum")
    rows = []
    if types:
        rows = statistics_during_period(
            hass,
            _ANALYSIS_START,
            None,
            {statistic_id},
            "hour",
            None,
            types,
        ).get(statistic_id, [])

    first = datetime.fromtimestamp(rows[0]["start"], tz=UTC) if rows else None
    last = datetime.fromtimestamp(rows[-1]["start"], tz=UTC) if rows else None
    return StatisticSnapshot(
        statistic_id=statistic_id,
        unit_of_measurement=metadata["unit_of_measurement"],
        unit_class=metadata["unit_class"],
        has_mean=has_mean,
        has_sum=has_sum,
        first=first,
        last=last,
        sample_count=len(rows),
    )
