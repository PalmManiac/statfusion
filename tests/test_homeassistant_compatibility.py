"""Smoke-test the Home Assistant APIs required by the integration."""

import importlib
import json
from importlib.metadata import version
from inspect import signature
from pathlib import Path

import pytest
from packaging.version import Version

pytest.importorskip("homeassistant")

_MINIMUM_HA_VERSION = Version("2024.10.0")


def test_manifest_minimum_matches_supported_recorder_api_floor() -> None:
    """Reject installs older than the Recorder and admin-service APIs used."""
    hacs_manifest = json.loads(Path("hacs.json").read_text(encoding="utf-8"))

    assert Version(hacs_manifest["homeassistant"]) == _MINIMUM_HA_VERSION
    assert Version(version("homeassistant")) >= _MINIMUM_HA_VERSION


def test_required_recorder_http_and_admin_apis_are_available() -> None:
    """Ensure imports and key function parameters survive across the CI matrix."""
    http = importlib.import_module("homeassistant.components.http")
    recorder = importlib.import_module("homeassistant.components.recorder")
    statistics = importlib.import_module("homeassistant.components.recorder.statistics")
    core = importlib.import_module("homeassistant.core")
    service = importlib.import_module("homeassistant.helpers.service")
    required_apis = (
        recorder.get_instance,
        statistics.get_metadata,
        statistics.get_last_statistics,
        statistics.statistics_during_period,
        statistics.async_import_statistics,
        core.valid_entity_id,
        http.require_admin,
        service.async_register_admin_service,
        http.HomeAssistantView,
    )

    assert all(callable(api) for api in required_apis)
    assert {"hass", "metadata", "statistics"} <= set(
        signature(statistics.async_import_statistics).parameters
    )
    assert {"hass", "number_of_stats", "statistic_id", "convert_units", "types"} <= set(
        signature(statistics.get_last_statistics).parameters
    )


def test_integration_modules_import_with_installed_home_assistant() -> None:
    """Catch import-time incompatibilities in the Recorder and HTTP adapters."""
    for module in (
        "custom_components.statfusion.recorder_reader",
        "custom_components.statfusion.services",
        "custom_components.statfusion.export",
    ):
        importlib.import_module(module)
