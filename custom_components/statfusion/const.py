"""Constants for StatFusion."""

DOMAIN = "statfusion"
NAME = "StatFusion"

CONF_SOURCE_STATISTIC_ID = "source_statistic_id"
CONF_TARGET_STATISTIC_ID = "target_statistic_id"

SERVICE_ANALYZE = "analyze"
SERVICE_MERGE = "merge"

PANEL_URL_PATH = DOMAIN
PANEL_COMPONENT_NAME = "statfusion-panel"
# Keep this token in step with frontend changes. A new URL guarantees that an
# already-open Home Assistant frontend loads the updated custom panel module.
PANEL_JS_VERSION = "5"
PANEL_JS_URL = f"/statfusion-static/statfusion-panel.js?v={PANEL_JS_VERSION}"
