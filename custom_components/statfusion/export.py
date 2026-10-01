"""Admin-only HTTP download for one Recorder statistics export."""

from __future__ import annotations

import json

from aiohttp import web
from homeassistant.components.http import KEY_HASS, HomeAssistantView, require_admin
from homeassistant.core import HomeAssistant, callback, valid_entity_id

from .const import DOMAIN
from .recorder_reader import async_read_statistic_dataset
from .transfer_format import TransferFormatError, build_transfer_package

_VIEW_DATA_KEY = f"{DOMAIN}_statistics_export_view"


class StatisticsExportView(HomeAssistantView):
    """Download a selected Recorder statistic as a portable JSON file."""

    url = "/api/statfusion/export"
    name = "api:statfusion:statistics-export"
    requires_auth = True

    def __init__(self) -> None:
        """Initialize the view in an inactive state until StatFusion loads."""
        self.active = False

    @require_admin
    async def get(self, request: web.Request) -> web.Response:
        """Return a validated one-statistic transfer package as a download."""
        if not self.active:
            return self.json_message("StatFusion is not loaded.", status_code=404)

        statistic_id = request.query.get("statistic_id", "").strip()
        if not statistic_id:
            return self.json_message("A statistic ID is required.", status_code=400)

        hass: HomeAssistant = request.app[KEY_HASS]
        _snapshot, metadata, rows = await async_read_statistic_dataset(
            hass, statistic_id
        )
        if (
            metadata is None
            or metadata.get("source") != "recorder"
            or not valid_entity_id(statistic_id)
        ):
            return self.json_message(
                "Only existing Home Assistant entity statistics can be exported.",
                status_code=400,
            )

        try:
            package = build_transfer_package(statistic_id, metadata, rows)
            body = json.dumps(
                package, ensure_ascii=False, separators=(",", ":"), allow_nan=False
            ).encode("utf-8")
        except (TransferFormatError, TypeError, ValueError) as err:
            return self.json_message(str(err), status_code=400)

        return web.Response(
            body=body,
            content_type="application/json",
            headers={
                "Content-Disposition": 'attachment; filename="statfusion-export.json"'
            },
        )


@callback
def async_register_statistics_export_view(hass: HomeAssistant) -> None:
    """Register the download endpoint once and enable it for this setup."""
    if view := hass.data.get(_VIEW_DATA_KEY):
        view.active = True
        return

    view = StatisticsExportView()
    view.active = True
    hass.http.register_view(view)
    hass.data[_VIEW_DATA_KEY] = view


@callback
def async_disable_statistics_export_view(hass: HomeAssistant) -> None:
    """Disable downloads while the config entry is unloaded."""
    if view := hass.data.get(_VIEW_DATA_KEY):
        view.active = False
