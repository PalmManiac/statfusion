"""Registration for the administrative StatFusion sidebar panel."""

from __future__ import annotations

from pathlib import Path

from homeassistant.components.frontend import (
    async_register_built_in_panel,
    async_remove_panel,
)
from homeassistant.components.http import StaticPathConfig
from homeassistant.core import HomeAssistant

from .const import DOMAIN, NAME, PANEL_COMPONENT_NAME, PANEL_JS_URL, PANEL_URL_PATH

_PANEL_FILE = Path(__file__).parent / "frontend" / "statfusion-panel.js"
_STATIC_PATH_REGISTERED = f"{DOMAIN}_panel_static_path_registered"


async def async_setup_panel(hass: HomeAssistant) -> None:
    """Serve and register the admin-only analysis panel."""
    if PANEL_URL_PATH in hass.data.get("frontend_panels", {}):
        return

    if not hass.data.get(_STATIC_PATH_REGISTERED):
        await hass.http.async_register_static_paths(
            [
                StaticPathConfig(
                    "/statfusion-static",
                    str(_PANEL_FILE.parent),
                    cache_headers=False,
                )
            ]
        )
        hass.data[_STATIC_PATH_REGISTERED] = True
    async_register_built_in_panel(
        hass,
        component_name="custom",
        sidebar_title=NAME,
        sidebar_icon="mdi:chart-timeline-variant-shimmer",
        frontend_url_path=PANEL_URL_PATH,
        config={
            "_panel_custom": {
                "name": PANEL_COMPONENT_NAME,
                "embed_iframe": True,
                "trust_external": False,
                "js_url": PANEL_JS_URL,
            }
        },
        require_admin=True,
    )


async def async_unload_panel(hass: HomeAssistant) -> None:
    """Remove the StatFusion sidebar entry when the integration unloads."""
    async_remove_panel(hass, PANEL_URL_PATH, warn_if_unknown=False)
