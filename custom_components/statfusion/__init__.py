"""StatFusion integration."""

from __future__ import annotations

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up StatFusion from a config entry.

    The initial scaffold deliberately has no runtime work. Future analysis
    services will be registered only after their recorder interactions are
    designed and tested independently.
    """
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a StatFusion config entry."""
    return True

