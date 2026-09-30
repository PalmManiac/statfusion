"""Safety checks for recorder-backed statistics transfer."""

from pathlib import Path

READER_PATH = Path("custom_components/statfusion/recorder_reader.py")


def test_statistics_read_uses_the_recorder_executor() -> None:
    """Keep recorder reads on Home Assistant's dedicated database executor."""
    reader = READER_PATH.read_text(encoding="utf-8")

    assert "from homeassistant.components.recorder import get_instance" in reader
    assert "await get_instance(hass).async_add_executor_job(" in reader


def test_merge_uses_only_recorder_statistics_helpers() -> None:
    """Keep reads and writes behind Home Assistant's recorder API."""
    reader = READER_PATH.read_text(encoding="utf-8")

    assert "get_metadata(" in reader
    assert "statistics_during_period(" in reader
    assert "get_last_statistics(" in reader
    assert "False," in reader
    assert "async_import_statistics(hass, metadata, rows)" in reader
    assert "await recorder.async_block_till_done()" in reader
    assert "sqlite" not in reader.lower()
    assert "sqlalchemy" not in reader.lower()


def test_merge_service_rejects_non_recorder_statistics() -> None:
    """Avoid feeding external statistics to the entity-statistics import API."""
    services = Path("custom_components/statfusion/services.py").read_text(
        encoding="utf-8"
    )

    assert 'source_metadata["source"] != "recorder"' in services
    assert 'target_metadata["source"] != "recorder"' in services
    assert "valid_entity_id(target_id)" in services
