"""Static checks for the packaged StatFusion sidebar panel."""

from pathlib import Path

PANEL_PATH = Path("custom_components/statfusion/frontend/statfusion-panel.js")
REGISTRATION_PATH = Path("custom_components/statfusion/panel.py")


def test_sidebar_panel_is_packaged_with_read_only_analysis_ui() -> None:
    """Keep the panel and its safe analysis contract available in releases."""
    panel = PANEL_PATH.read_text(encoding="utf-8")

    assert 'customElements.define("statfusion-panel", StatFusionPanel)' in panel
    assert 'type: "recorder/list_statistic_ids"' in panel
    assert 'service: "analyze"' in panel
    assert "return_response: true" in panel
    assert "Die Prüfung verändert keine Daten." in panel


def test_sidebar_panel_is_admin_only_and_served_by_the_integration() -> None:
    """Ensure installation supplies the menu entry and its bundled module."""
    registration = REGISTRATION_PATH.read_text(encoding="utf-8")

    assert 'component_name="custom"' in registration
    assert 'sidebar_title=NAME' in registration
    assert 'require_admin=True' in registration
    assert '"js_url": PANEL_JS_URL' in registration
