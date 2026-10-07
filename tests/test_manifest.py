"""Static tests for the custom-integration manifest."""

import json
from pathlib import Path

MANIFEST_PATH = Path("custom_components/statfusion/manifest.json")


def test_manifest_has_required_custom_integration_metadata() -> None:
    """Keep the HACS-required metadata explicit and stable."""
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))

    assert manifest["domain"] == "statfusion"
    assert manifest["name"] == "StatFusion"
    assert manifest["version"] == "1.2.3"
    assert manifest["config_flow"] is True
    assert manifest["dependencies"] == ["frontend", "http", "recorder"]
    assert manifest["integration_type"] == "service"
    assert manifest["documentation"].startswith("https://")
    assert manifest["issue_tracker"].endswith("/issues")
    assert manifest["codeowners"] == ["@PalmManiac"]


def test_hacs_manifest_declares_minimum_home_assistant_version() -> None:
    """Declare compatibility in HACS metadata, not the HA integration manifest."""
    hacs_manifest = json.loads(Path("hacs.json").read_text(encoding="utf-8"))

    assert hacs_manifest["homeassistant"] == "2024.10.0"


def test_release_documentation_is_linked_and_does_not_call_review_approval() -> None:
    """Keep release guides discoverable and use cautious analysis wording."""
    readme = Path("README.md").read_text(encoding="utf-8")
    english_guide = Path("docs/user-guide.md").read_text(encoding="utf-8")
    german_guide = Path("docs/anleitung.md").read_text(encoding="utf-8")

    assert "[English user guide](docs/user-guide.md)" in readme
    assert "[Deutsche Anleitung](docs/anleitung.md)" in readme
    assert "Ready for review" in english_guide
    assert "Bereit zur Prüfung" in german_guide
    assert "warnings_confirmed: true" in english_guide
    assert "warnings_confirmed: true" in german_guide
