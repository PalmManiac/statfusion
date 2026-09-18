"""StatFusion integration."""

from __future__ import annotations

from typing import Any


async def async_setup_entry(hass: Any, entry: Any) -> bool:
    """Set up StatFusion from a config entry.

    StatFusion only registers a read-only analyzer. It does not create
    entities, run in the background, or change recorder data.
    """
    from .services import async_setup_services

    await async_setup_services(hass)
    return True


async def async_unload_entry(hass: Any, entry: Any) -> bool:
    """Unload a StatFusion config entry."""
    from .services import async_unload_services

    await async_unload_services(hass)
    return True
