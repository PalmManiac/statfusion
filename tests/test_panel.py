"""Static checks for the packaged StatFusion sidebar panel."""

from pathlib import Path

PANEL_PATH = Path("custom_components/statfusion/frontend/statfusion-panel.js")
REGISTRATION_PATH = Path("custom_components/statfusion/panel.py")
CONSTANTS_PATH = Path("custom_components/statfusion/const.py")


def test_sidebar_panel_is_packaged_with_analysis_and_merge_ui() -> None:
    """Keep the analysis and explicitly confirmed merge controls packaged."""
    panel = PANEL_PATH.read_text(encoding="utf-8")

    assert 'customElements.define("statfusion-panel", StatFusionPanel)' in panel
    assert 'type: "recorder/list_statistic_ids"' in panel
    assert 'service: "analyze"' in panel
    assert "return_response: true" in panel
    assert "Die Prüfung verändert keine Daten." in panel
    assert "energy_flow_mismatch" in panel
    assert "Zwischen Quelle und Ziel besteht eine Zeitlücke." in panel
    assert "#analyze { background:#0878d1;" in panel
    assert 'id="export-source"' in panel
    assert 'id="transfer-file"' in panel
    assert 'id="preview-transfer"' in panel
    assert 'id="transfer-backup-confirmed"' in panel
    assert 'id="transfer-warnings-confirmed"' in panel
    assert 'id="transfer-import-confirmed"' in panel
    assert 'id="import-transfer"' in panel
    assert 'id="transfer-dialog"' in panel
    assert 'id="open-transfer-dialog"' in panel
    assert 'id="transfer-target-value"' in panel
    assert 'data-picker-role="transfer-target"' in panel
    assert '_transferDialogTemplate()' in panel
    assert "_applyFrameTheme()" in panel
    assert 'frame = window.frameElement' in panel
    assert 'this._themeObserver.observe(frame' in panel
    assert "--sf-surface: #fff;" in panel
    assert "--sf-surface: #242728;" in panel
    assert "background:var(--card-background-color, var(--sf-surface))" in panel
    assert "border:2px solid var(--divider-color, var(--sf-divider))" in panel
    assert "this.style.colorScheme = luminance < 128 ? \"dark\" : \"light\";" in panel
    assert 'transferDialog.showModal()' in panel
    assert 'id="close-transfer-dialog"' in panel
    assert 'id="cancel-transfer-dialog"' in panel
    assert 'id="export-source-id"' in panel
    assert 'data-picker-role="export-source"' in panel
    assert 'class="workflow-grid"' in panel
    assert 'class="workspace merge-workspace"' in panel
    assert 'class="workspace transfer-workspace"' in panel
    assert 'dialog.workflow-dialog:not([open]) { display:none; }' in panel
    assert 'this._transferTarget.trim()' in panel
    assert 'url = "/api/statfusion/import/preview"' in Path(
        "custom_components/statfusion/export.py"
    ).read_text(encoding="utf-8")
    assert "_transferPreviewTemplate()" in panel
    assert "Die Vorschau verändert keine Recorder-Daten." in panel
    assert "fetch(url," in panel
    assert "connection?.options?.auth?.accessToken" in panel
    assert "Authorization: `Bearer ${accessToken}`" in panel
    assert 'querySelector("#source").addEventListener("input"' in panel
    assert 'querySelector("#target").addEventListener("input"' in panel
    assert 'data-picker-role="source"' in panel
    assert 'data-picker-role="target"' in panel
    assert 'id="statistic-search"' in panel
    assert 'id="picker-dialog"' in panel
    assert "pickerDialog.showModal()" in panel
    assert "dialog.picker::backdrop" in panel
    assert 'pickerDialog.addEventListener("cancel"' in panel
    assert "Statistik suchen" in panel
    assert "Übernahmeplan zur Prüfung" in panel
    assert 'service: "merge"' in panel
    assert 'id="backup-confirmed"' in panel
    assert 'id="warnings-confirmed"' in panel
    assert 'id="merge-confirmed"' in panel
    assert 'id="merge"' in panel
    assert "Übernahme abgeschlossen" in panel
    assert 'name="collision-resolution" value="target"' in panel
    assert 'name="collision-resolution" value="source"' in panel
    assert 'name="collision-resolution" value="cancel"' in panel
    assert 'finding.code === "time_range_overlap"' in panel
    assert (
        "Der Recorder hat keine identischen Stundenstarts gefunden. "
        "Deshalb gibt es keine Konflikt-Auswahl."
    ) in panel
    assert (
        "Die Analyse enthält keine Konfliktdaten. "
        "Führe die Kompatibilitätsprüfung erneut aus."
    ) in panel
    assert (
        "Konflikt-Auswahl gesperrt: Zuerst die blockierenden "
        "Kompatibilitätshinweise klären."
    ) in panel
    assert 'input[type="radio"] { accent-color:#0878d1;' in panel
    assert ".collision-resolution input[type=\"radio\"]" in panel
    assert "expected_collision_count: overlap.count" in panel
    assert "expected_collision_fingerprint: overlap.fingerprint" in panel
    assert "Die Quelle und bereits vorhandene Zielstunden bleiben unverändert." in panel
    assert "mögliche Sprünge bei kumulativen Werten" in panel
    assert "vollständige Home-Assistant-Sicherung" in panel
    assert 'role="alert"' in panel
    assert "Die Nutzung erfolgt auf eigene Gefahr." in panel
    assert "_isEnglish()" in panel
    assert "EN_TRANSLATIONS" in panel
    assert "I have created a full Home Assistant backup before merging." in panel
    assert "window.confirm" in panel
    assert "Zeitlicher Übergang" in panel
    assert "Zwischen Quelle und Ziel liegt eine Zeitlücke" in panel
    assert "Quelle und Ziel überlappen sich" in panel
    assert "Das Ziel beginnt zeitlich vor der Quelle." in panel
    assert "Falsche Reihenfolge" in panel
    assert "Prüfstatus" in panel
    assert "Energiefluss" in panel
    assert "Keine blockierende technische Abweichung erkannt." in panel
    assert 'id="copy-result"' in panel
    assert "Analyse kopieren" in panel
    assert "navigator.clipboard.writeText" in panel
    assert "Die Analyse verändert keine Daten." in panel
    assert 'const status = blocked ? "Nicht bereit" : "Bereit zur Prüfung";' in panel
    assert 'entry.decision === "blocked" ? "Blockiert" : "Bereit zur Prüfung"' in panel
    assert "Letzte Prüfungen" in panel
    assert "in dieser Ansicht" in panel
    assert 'class="reuse-analysis"' in panel
    assert "_rememberAnalysis" in panel
    assert 'class="result-layout"' in panel
    assert '<details class="review-plan"' in panel


def test_sidebar_panel_is_admin_only_and_served_by_the_integration() -> None:
    """Ensure installation supplies the menu entry and its bundled module."""
    registration = REGISTRATION_PATH.read_text(encoding="utf-8")

    assert 'component_name="custom"' in registration
    assert "sidebar_title=NAME" in registration
    assert "require_admin=True" in registration
    assert '"js_url": PANEL_JS_URL' in registration


def test_sidebar_panel_module_url_has_a_version_token() -> None:
    """Force browser clients to request each shipped panel revision."""
    constants = CONSTANTS_PATH.read_text(encoding="utf-8")

    assert 'PANEL_JS_VERSION = "14"' in constants
    assert "statfusion-panel.js?v={PANEL_JS_VERSION}" in constants


def test_statistics_export_is_admin_only_and_disabled_when_unloaded() -> None:
    """Protect transfer-file downloads and limit them to Recorder statistics."""
    export = Path("custom_components/statfusion/export.py").read_text(encoding="utf-8")
    integration = Path("custom_components/statfusion/__init__.py").read_text(
        encoding="utf-8"
    )

    assert 'url = "/api/statfusion/export"' in export
    assert "requires_auth = True" in export
    assert "@require_admin" in export
    assert "async_read_statistic_dataset" in export
    assert 'metadata.get("source") != "recorder"' in export
    assert "async_register_statistics_export_view(hass)" in integration
    assert "async_disable_statistics_export_view(hass)" in integration
