"""Safety checks for the recorder-backed, read-only statistics lookup."""

from pathlib import Path

READER_PATH = Path("custom_components/statfusion/recorder_reader.py")


def test_statistics_read_uses_the_recorder_executor() -> None:
    """Keep recorder reads on Home Assistant's dedicated database executor."""
    reader = READER_PATH.read_text(encoding="utf-8")

    assert "from homeassistant.components.recorder import get_instance" in reader
    assert "await get_instance(hass).async_add_executor_job(" in reader


def test_statistics_reader_remains_read_only() -> None:
    """Guard the V1 promise that analysis never writes recorder data."""
    reader = READER_PATH.read_text(encoding="utf-8")

    assert "get_metadata(" in reader
    assert "statistics_during_period(" in reader
    assert "update_statistics" not in reader
    assert "import_statistics" not in reader
