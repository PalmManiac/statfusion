"""Admin-only HTTP download for one Recorder statistics export."""

from __future__ import annotations

import json

from aiohttp import web
from homeassistant.components.http import KEY_HASS, HomeAssistantView, require_admin
from homeassistant.core import HomeAssistant, callback, valid_entity_id

from .const import DOMAIN
from .merge_plan import MergePlanError, inspect_collisions
from .recorder_reader import (
    async_import_hourly_statistics,
    async_read_statistic_dataset,
)
from .transfer_format import (
    MAX_TRANSFER_BYTES,
    TransferFormatError,
    build_transfer_package,
    parse_transfer_package,
)
from .transfer_import import (
    plan_transfer_import,
    rows_at_starts,
    verify_transfer_data,
)
from .transfer_preview import analyze_transfer_preview

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


class StatisticsImportPreviewView(HomeAssistantView):
    """Validate an uploaded package and compare it to one local target."""

    url = "/api/statfusion/import/preview"
    name = "api:statfusion:statistics-import-preview"
    requires_auth = True

    def __init__(self) -> None:
        """Initialize the view disabled until StatFusion loads."""
        self.active = False

    @require_admin
    async def post(self, request: web.Request) -> web.Response:
        """Return a read-only compatibility preview for an uploaded JSON file."""
        if not self.active:
            return self.json_message("StatFusion is not loaded.", status_code=404)

        target_id = request.query.get("target_statistic_id", "").strip()
        if not target_id or not valid_entity_id(target_id):
            return self.json_message(
                "A valid target entity statistic ID is required.", status_code=400
            )
        if request.content_length and request.content_length > MAX_TRANSFER_BYTES:
            return self.json_message("The transfer file is too large.", status_code=413)

        # Raise aiohttp's per-request body cap to the same strict limit applied
        # by the format parser. Home Assistant's default request cap is lower.
        request._client_max_size = MAX_TRANSFER_BYTES  # noqa: SLF001
        raw_file = await request.read()
        hass: HomeAssistant = request.app[KEY_HASS]
        try:
            package = await hass.async_add_executor_job(
                parse_transfer_package, raw_file
            )
        except TransferFormatError as err:
            return self.json_message(str(err), status_code=400)

        target, metadata, target_rows = await async_read_statistic_dataset(
            hass, target_id
        )
        if (
            metadata is None
            or metadata.get("source") != "recorder"
            or not valid_entity_id(target_id)
        ):
            return self.json_message(
                "The target must be an existing Home Assistant entity statistic.",
                status_code=400,
            )

        analysis, collisions = await hass.async_add_executor_job(
            analyze_transfer_preview, package, target, target_rows
        )
        response = analysis.as_dict()
        response["target_statistic_id"] = target_id
        response["exported_at"] = package.exported_at.isoformat()
        response["colliding_hours"] = collisions
        collision_summary = await hass.async_add_executor_job(
            inspect_collisions, list(package.rows), target_rows
        )
        response["collision_fingerprint"] = collision_summary.fingerprint
        response["source_overwrite_safe"] = collision_summary.source_overwrite_safe
        response["first_collision"] = (
            collision_summary.first.isoformat() if collision_summary.first else None
        )
        response["last_collision"] = (
            collision_summary.last.isoformat() if collision_summary.last else None
        )
        return self.json(response)


class StatisticsImportView(HomeAssistantView):
    """Import a validated package into a selected destination statistic."""

    url = "/api/statfusion/import"
    name = "api:statfusion:statistics-import"
    requires_auth = True

    def __init__(self) -> None:
        """Initialize the view disabled until StatFusion loads."""
        self.active = False

    @require_admin
    async def post(self, request: web.Request) -> web.Response:
        """Recheck, import through Recorder, and verify every exported hour."""
        if not self.active:
            return self.json_message("StatFusion is not loaded.", status_code=404)
        if not all(
            request.headers.get(header, "").lower() == "true"
            for header in (
                "X-StatFusion-Backup-Confirmed",
                "X-StatFusion-Warnings-Confirmed",
                "X-StatFusion-Import-Confirmed",
            )
        ):
            return self.json_message(
                "A full backup, warning review, and explicit import confirmation "
                "are required.",
                status_code=400,
            )

        target_id = request.query.get("target_statistic_id", "").strip()
        if not target_id or not valid_entity_id(target_id):
            return self.json_message(
                "A valid target entity statistic ID is required.", status_code=400
            )
        if request.content_length and request.content_length > MAX_TRANSFER_BYTES:
            return self.json_message("The transfer file is too large.", status_code=413)

        request._client_max_size = MAX_TRANSFER_BYTES  # noqa: SLF001
        raw_file = await request.read()
        hass: HomeAssistant = request.app[KEY_HASS]
        try:
            package = await hass.async_add_executor_job(
                parse_transfer_package, raw_file
            )
        except TransferFormatError as err:
            return self.json_message(str(err), status_code=400)

        # Re-read the destination immediately before importing. Its current
        # Recorder metadata and rows, never the file's metadata, drive the write.
        target, metadata, target_rows = await async_read_statistic_dataset(
            hass, target_id
        )
        if metadata is None or metadata.get("source") != "recorder":
            return self.json_message(
                "The target must be an existing Recorder entity statistic.",
                status_code=400,
            )
        analysis, _collisions = await hass.async_add_executor_job(
            analyze_transfer_preview, package, target, target_rows
        )
        collision_summary = await hass.async_add_executor_job(
            inspect_collisions, list(package.rows), target_rows
        )
        collisions = collision_summary.count
        expected_count = request.query.get("expected_collision_count")
        expected_fingerprint = request.query.get("expected_collision_fingerprint")
        if collisions and (expected_count is None or expected_fingerprint is None):
            return self.json_message(
                "Run the preview and choose how to resolve the overlapping hours.",
                status_code=409,
            )
        if expected_count is not None:
            try:
                count_matches = int(expected_count) == collisions
            except ValueError:
                count_matches = False
            if (
                not count_matches
                or expected_fingerprint != collision_summary.fingerprint
            ):
                return self.json_message(
                    "The overlapping hours changed after preview. Run the preview "
                    "again before importing.",
                    status_code=409,
                )
        if analysis.decision.value == "blocked":
            return self.json_message(
                "The import is blocked because the target is no longer compatible.",
                status_code=409,
            )

        collision_resolution = request.query.get("collision_resolution")
        try:
            plan = await hass.async_add_executor_job(
                plan_transfer_import, package, target_rows, collision_resolution
            )
        except MergePlanError as err:
            return self.json_message(str(err), status_code=409)

        rows = list(plan.rows_to_import)
        if rows:
            await async_import_hourly_statistics(hass, metadata, rows)

        (
            _verified,
            _verified_metadata,
            verified_rows,
        ) = await async_read_statistic_dataset(hass, target_id)
        verified = await hass.async_add_executor_job(
            verify_transfer_data, rows, verified_rows
        )
        preserved_target_rows = rows_at_starts(
            target_rows, plan.collision_summary.starts
        )
        preserved = collision_resolution != "target"
        if not preserved:
            preserved = await hass.async_add_executor_job(
                verify_transfer_data,
                preserved_target_rows,
                verified_rows,
            )
        if not verified or not preserved:
            return self.json_message(
                "The Recorder finished the import, but post-import verification "
                "failed. Restore from the backup if the target is incomplete.",
                status_code=500,
            )

        result = {
            "status": "completed",
            "source_statistic_id": package.source["statistic_id"],
            "target_statistic_id": target_id,
            "imported_hours": len(rows),
            "added_hours": plan.added_hours,
            "replaced_hours": plan.replaced_hours,
            "preserved_target_hours": plan.preserved_target_hours,
            "collision_resolution": collision_resolution,
            "source_preserved": True,
            "existing_target_hours_preserved": plan.replaced_hours == 0,
            "verified": True,
        }
        return self.json(result)


@callback
def async_register_statistics_export_view(hass: HomeAssistant) -> None:
    """Register transfer endpoints once and enable them for this setup."""
    if views := hass.data.get(_VIEW_DATA_KEY):
        for view in views:
            view.active = True
        return

    views = (
        StatisticsExportView(),
        StatisticsImportPreviewView(),
        StatisticsImportView(),
    )
    for view in views:
        view.active = True
        hass.http.register_view(view)
    hass.data[_VIEW_DATA_KEY] = views


@callback
def async_disable_statistics_export_view(hass: HomeAssistant) -> None:
    """Disable transfer endpoints while the config entry is unloaded."""
    if views := hass.data.get(_VIEW_DATA_KEY):
        for view in views:
            view.active = False
