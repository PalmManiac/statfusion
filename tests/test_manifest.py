"""Static tests for the custom-integration manifest."""

import json
from pathlib import Path

MANIFEST_PATH = Path("custom_components/statfusion/manifest.json")


def test_manifest_has_required_custom_integration_metadata() -> None:
    """Keep the HACS-required metadata explicit and stable."""
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))

    assert manifest["domain"] == "statfusion"
    assert manifest["name"] == "StatFusion"
    assert manifest["version"] == "0.1.0"
    assert manifest["config_flow"] is True
    assert manifest["dependencies"] == ["frontend", "recorder"]
    assert manifest["integration_type"] == "service"
    assert manifest["documentation"].startswith("https://")
    assert manifest["issue_tracker"].endswith("/issues")
    assert manifest["codeowners"] == ["@PalmManiac"]
