"""Read-only StatFusion actions exposed through Home Assistant."""

from __future__ import annotations

import voluptuous as vol
from homeassistant.core import (
    HomeAssistant,
    ServiceCall,
    ServiceResponse,
    SupportsResponse,
)
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.service import async_register_admin_service

from .analyzer import analyze_merge
from .const import (
    CONF_SOURCE_STATISTIC_ID,
    CONF_TARGET_STATISTIC_ID,
    DOMAIN,
    SERVICE_ANALYZE,
)
from .recorder_reader import async_read_statistic_snapshot

_ANALYZE_SCHEMA = vol.Schema(
    {
        vol.Required(CONF_SOURCE_STATISTIC_ID): cv.string,
        vol.Required(CONF_TARGET_STATISTIC_ID): cv.string,
    }
)


async def async_setup_services(hass: HomeAssistant) -> None:
    """Register analysis-only actions once for the integration."""
    async_register_admin_service(
        hass,
        DOMAIN,
        SERVICE_ANALYZE,
        _async_handle_analyze,
        schema=_ANALYZE_SCHEMA,
        supports_response=SupportsResponse.ONLY,
    )


async def async_unload_services(hass: HomeAssistant) -> None:
    """Remove actions when the single StatFusion entry is unloaded."""
    hass.services.async_remove(DOMAIN, SERVICE_ANALYZE)


async def _async_handle_analyze(call: ServiceCall) -> ServiceResponse:
    """Read and analyze source and target statistic IDs."""
    source = await async_read_statistic_snapshot(
        call.hass, call.data[CONF_SOURCE_STATISTIC_ID]
    )
    target = await async_read_statistic_snapshot(
        call.hass, call.data[CONF_TARGET_STATISTIC_ID]
    )
    return analyze_merge(source, target).as_dict()
