"""StatFusion actions for analyzing and merging statistics."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

import voluptuous as vol
from homeassistant.core import (
    HomeAssistant,
    ServiceCall,
    ServiceResponse,
    SupportsResponse,
    valid_entity_id,
)
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.service import async_register_admin_service

from .analyzer import analyze_merge
from .const import (
    CONF_SOURCE_STATISTIC_ID,
    CONF_TARGET_STATISTIC_ID,
    DOMAIN,
    SERVICE_ANALYZE,
    SERVICE_MERGE,
)
from .recorder_reader import (
    async_import_hourly_statistics,
    async_read_statistic_dataset,
    async_read_statistic_snapshot,
)

_PAIR_SCHEMA = {
    vol.Required(CONF_SOURCE_STATISTIC_ID): cv.string,
    vol.Required(CONF_TARGET_STATISTIC_ID): cv.string,
}
_ANALYZE_SCHEMA = vol.Schema(_PAIR_SCHEMA)
_MERGE_SCHEMA = vol.Schema(
    {
        **_PAIR_SCHEMA,
        vol.Required("confirm"): vol.Boolean(),
        vol.Required("backup_confirmed"): vol.Boolean(),
        vol.Required("warnings_confirmed"): vol.Boolean(),
    }
)


async def async_setup_services(hass: HomeAssistant) -> None:
    """Register admin-only analysis and confirmed merge actions."""
    async_register_admin_service(
        hass,
        DOMAIN,
        SERVICE_ANALYZE,
        _async_handle_analyze,
        schema=_ANALYZE_SCHEMA,
        supports_response=SupportsResponse.ONLY,
    )
    async_register_admin_service(
        hass,
        DOMAIN,
        SERVICE_MERGE,
        _async_handle_merge,
        schema=_MERGE_SCHEMA,
        supports_response=SupportsResponse.ONLY,
    )


async def async_unload_services(hass: HomeAssistant) -> None:
    """Remove actions when the integration is unloaded."""
    hass.services.async_remove(DOMAIN, SERVICE_ANALYZE)
    hass.services.async_remove(DOMAIN, SERVICE_MERGE)


async def _async_handle_analyze(call: ServiceCall) -> ServiceResponse:
    """Read and analyze source and target statistic IDs."""
    source = await async_read_statistic_snapshot(
        call.hass, call.data[CONF_SOURCE_STATISTIC_ID]
    )
    target = await async_read_statistic_snapshot(
        call.hass, call.data[CONF_TARGET_STATISTIC_ID]
    )
    return analyze_merge(source, target).as_dict()


async def _async_handle_merge(call: ServiceCall) -> ServiceResponse:
    """Copy source rows into target after fresh checks and explicit consent."""
    if (
        not call.data["confirm"]
        or not call.data["backup_confirmed"]
        or not call.data["warnings_confirmed"]
    ):
        raise HomeAssistantError(
            "A full backup, warning review, and explicit merge confirmation "
            "are required."
        )

    source_id = call.data[CONF_SOURCE_STATISTIC_ID]
    target_id = call.data[CONF_TARGET_STATISTIC_ID]
    source, source_metadata, source_rows = await async_read_statistic_dataset(
        call.hass, source_id
    )
    target, target_metadata, target_rows = await async_read_statistic_dataset(
        call.hass, target_id
    )
    analysis = analyze_merge(source, target)
    if analysis.decision.value == "blocked":
        raise HomeAssistantError("The selected statistics are not safe to merge.")
    if source_metadata is None or target_metadata is None:
        raise HomeAssistantError("Source or target statistics metadata is missing.")
    if (
        source_metadata["source"] != "recorder"
        or target_metadata["source"] != "recorder"
        or not valid_entity_id(target_id)
    ):
        raise HomeAssistantError(
            "This merge currently supports only Home Assistant entity statistics "
            "managed by the recorder."
        )

    source_starts = {_row_start(row) for row in source_rows}
    target_starts = {_row_start(row) for row in target_rows}
    collisions = source_starts & target_starts
    if collisions:
        raise HomeAssistantError(
            f"Merge blocked: {len(collisions)} source timestamps already exist "
            "in the target."
        )

    import_rows = [_prepare_import_row(row) for row in source_rows]
    await async_import_hourly_statistics(call.hass, target_metadata, import_rows)

    _verified_snapshot, _verified_metadata, verified_rows = (
        await async_read_statistic_dataset(call.hass, target_id)
    )
    target_rows_by_start = {_row_start(row): row for row in verified_rows}
    if not all(
        _row_matches(source_row, target_rows_by_start.get(_row_start(source_row)))
        for source_row in source_rows
    ):
        raise HomeAssistantError(
            "The recorder finished the import, but post-import verification failed."
        )

    return {
        "status": "completed",
        "source_statistic_id": source_id,
        "target_statistic_id": target_id,
        "imported_hours": len(source_rows),
        "source_preserved": True,
        "existing_target_hours_preserved": True,
        "summary": (
            f"{len(source_rows)} hourly values were added to the target. "
            "The source and existing target hours were preserved."
        ),
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
