"""Home Assistant recorder adapters for hourly statistics."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from homeassistant.components.recorder import get_instance
from homeassistant.components.recorder.statistics import (
    async_import_statistics,
    get_last_statistics,
    get_metadata,
    statistics_during_period,
)
from homeassistant.core import HomeAssistant

from .models import StatisticSnapshot

_ANALYSIS_START = datetime(1970, 1, 1, tzinfo=UTC)
_ROW_TYPES = {"last_reset", "max", "mean", "min", "state", "sum"}


async def async_read_statistic_snapshot(
    hass: HomeAssistant, statistic_id: str
) -> StatisticSnapshot:
    """Read metadata and hourly boundaries through recorder helpers."""
    snapshot, _metadata, _rows = await async_read_statistic_dataset(hass, statistic_id)
    return snapshot


async def async_read_statistic_dataset(
    hass: HomeAssistant, statistic_id: str
) -> tuple[StatisticSnapshot, dict[str, Any] | None, list[dict[str, Any]]]:
    """Read statistic metadata and its unconverted hourly rows."""
    return await get_instance(hass).async_add_executor_job(
        _read_statistic_dataset, hass, statistic_id
    )


def _read_statistic_dataset(
    hass: HomeAssistant, statistic_id: str
) -> tuple[StatisticSnapshot, dict[str, Any] | None, list[dict[str, Any]]]:
    """Read one statistic using Home Assistant's recorder helpers."""
    metadata_by_id = get_metadata(hass, statistic_ids={statistic_id})
    if statistic_id not in metadata_by_id:
        return (
            StatisticSnapshot(
                statistic_id=statistic_id,
                unit_of_measurement=None,
                unit_class=None,
                has_mean=False,
                has_sum=False,
                first=None,
                last=None,
                sample_count=0,
            ),
            None,
            [],
        )

    metadata: dict[str, Any] = dict(metadata_by_id[statistic_id][1])
    mean_type = str(int(metadata["mean_type"]))
    has_mean = bool(int(metadata["mean_type"]))
    has_sum = bool(metadata["has_sum"])
    types = set(_ROW_TYPES) if has_sum else set()
    if has_mean:
        types.update({"max", "mean", "min"})
    displayed_rows = (
        statistics_during_period(
            hass,
            _ANALYSIS_START,
            None,
            {statistic_id},
            "hour",
            None,
            types,
        ).get(statistic_id, [])
        if types
        else []
    )
    # statistics_during_period converts values to the entity's current display
    # unit and drops mean_weight. Use the recorder's raw last-statistics helper
    # for the actual import payload so values and weighted means stay intact.
    rows = (
        list(
            reversed(
                get_last_statistics(
                    hass,
                    len(displayed_rows),
                    statistic_id,
                    False,
                    types,
                ).get(statistic_id, [])
            )
        )
        if displayed_rows
        else []
    )

    first = datetime.fromtimestamp(rows[0]["start"], tz=UTC) if rows else None
    last = datetime.fromtimestamp(rows[-1]["start"], tz=UTC) if rows else None
    snapshot = StatisticSnapshot(
        statistic_id=statistic_id,
        unit_of_measurement=metadata["unit_of_measurement"],
        unit_class=metadata["unit_class"],
        has_mean=has_mean,
        has_sum=has_sum,
        first=first,
        last=last,
        sample_count=len(rows),
        mean_type=mean_type,
    )
    return snapshot, metadata, rows


async def async_import_hourly_statistics(
    hass: HomeAssistant,
    metadata: dict[str, Any],
    rows: list[dict[str, Any]],
) -> None:
    """Queue hourly rows for a statistic and wait until the recorder commits."""
    recorder = get_instance(hass)
    async_import_statistics(hass, metadata, rows)
    await recorder.async_block_till_done()
