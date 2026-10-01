"""StatFusion integration."""

from __future__ import annotations

from typing import Any


async def async_setup_entry(hass: Any, entry: Any) -> bool:
    """Set up StatFusion from a config entry.

    StatFusion offers an explicit analyzer and confirmed historical-statistics
    merge, with a portable long-term statistics export. It does not create
    entities or run background tasks.
    """
    from .export import async_register_statistics_export_view
    from .panel import async_setup_panel
    from .services import async_setup_services

    async_register_statistics_export_view(hass)
    await async_setup_services(hass)
    await async_setup_panel(hass)
    return True


async def async_unload_entry(hass: Any, entry: Any) -> bool:
    """Unload a StatFusion config entry."""
    from .export import async_disable_statistics_export_view
    from .panel import async_unload_panel
    from .services import async_unload_services

    await async_unload_panel(hass)
    await async_unload_services(hass)
    async_disable_statistics_export_view(hass)
    return True
