"""StatFusion actions for analyzing and merging statistics."""

from __future__ import annotations

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
from .executor_work import analyze_statistics, prepare_merge_work, verify_merge_work
from .merge_plan import MergePlanError
from .recorder_reader import (
    async_import_hourly_statistics,
    async_read_statistic_dataset,
)

_PAIR_SCHEMA = {
    vol.Required(CONF_SOURCE_STATISTIC_ID): cv.string,
    vol.Required(CONF_TARGET_STATISTIC_ID): cv.string,
}
_ANALYZE_SCHEMA = vol.Schema(_PAIR_SCHEMA)
_MERGE_SCHEMA = vol.Schema(
    {
        **_PAIR_SCHEMA,
        vol.Optional("collision_resolution"): vol.In({"source", "target"}),
        vol.Optional("expected_collision_count"): vol.All(int, vol.Range(min=0)),
        vol.Optional("expected_collision_fingerprint"): cv.string,
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
    source, _source_metadata, source_rows = await async_read_statistic_dataset(
        call.hass, call.data[CONF_SOURCE_STATISTIC_ID]
    )
    target, _target_metadata, target_rows = await async_read_statistic_dataset(
        call.hass, call.data[CONF_TARGET_STATISTIC_ID]
    )
    return await call.hass.async_add_executor_job(
        analyze_statistics, source, target, source_rows, target_rows
    )


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
    if analyze_merge(source, target).decision.value == "blocked":
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

    try:
        plan, import_rows = await call.hass.async_add_executor_job(
            prepare_merge_work,
            source_rows,
            target_rows,
            call.data.get("collision_resolution"),
            call.data.get("expected_collision_count"),
            call.data.get("expected_collision_fingerprint"),
        )
    except MergePlanError as err:
        raise HomeAssistantError(str(err)) from err
    if import_rows:
        await async_import_hourly_statistics(call.hass, target_metadata, import_rows)

    _verified_snapshot, _verified_metadata, verified_rows = (
        await async_read_statistic_dataset(call.hass, target_id)
    )
    merge_verified = await call.hass.async_add_executor_job(
        verify_merge_work,
        plan,
        verified_rows,
        target_rows,
        call.data.get("collision_resolution"),
    )
    if not merge_verified:
        raise HomeAssistantError(
            "The recorder finished the import, but post-import verification failed."
        )

    return {
        "status": "completed",
        "source_statistic_id": source_id,
        "target_statistic_id": target_id,
        "imported_hours": len(plan.rows_to_import),
        "added_hours": plan.added_hours,
        "replaced_hours": plan.replaced_hours,
        "preserved_target_hours": plan.preserved_target_hours,
        "collision_resolution": call.data.get("collision_resolution"),
        "source_preserved": True,
        "existing_target_hours_preserved": plan.replaced_hours == 0,
        "summary": (
            f"{plan.added_hours} new hourly values were added to the target; "
            f"{plan.replaced_hours} overlapping hours were replaced. "
            "The source statistic was preserved."
        ),
    }
