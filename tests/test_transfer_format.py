"""Validation tests for cross-installation statistics export files."""

from datetime import UTC, datetime

import pytest

from custom_components.statfusion.transfer_format import (
    FORMAT,
    FORMAT_VERSION,
    TransferFormatError,
    build_transfer_package,
    parse_transfer_package,
)

_SOURCE = {
    "statistic_id": "sensor.old_energy_meter",
    "unit_of_measurement": "kWh",
    "unit_class": "energy",
    "has_sum": True,
    "has_mean": False,
    "mean_type": "0",
}
_ROW = {
    "start": "2024-01-01T00:00:00+00:00",
    "last_reset": None,
    "state": 12.5,
    "sum": 12.5,
}


def _package(rows=None):
    return {
        "format": FORMAT,
        "format_version": FORMAT_VERSION,
        "exported_at": "2026-10-01T12:00:00+00:00",
        "source": dict(_SOURCE),
        "rows": list(rows if rows is not None else [_ROW]),
    }


def test_package_round_trip_serializes_utc_hours_and_raw_values() -> None:
    package = build_transfer_package(
        "sensor.old_energy_meter",
        {
            "unit_of_measurement": "kWh",
            "unit_class": "energy",
            "has_sum": True,
            "mean_type": 0,
        },
        [
            {
                "start": datetime(2024, 1, 1, tzinfo=UTC),
                "state": 12.5,
                "sum": 12.5,
                "ignored_internal_field": "not exported",
            }
        ],
        exported_at=datetime(2026, 10, 1, 12, tzinfo=UTC),
    )

    parsed = parse_transfer_package(package)

    assert parsed.source["statistic_id"] == "sensor.old_energy_meter"
    assert parsed.rows[0]["start"] == datetime(2024, 1, 1, tzinfo=UTC)
    assert parsed.rows[0]["sum"] == 12.5
    assert "ignored_internal_field" not in package["rows"][0]


@pytest.mark.parametrize(
    ("rows", "message"),
    [
        ([_ROW, _ROW], "unique, ascending"),
        ([{**_ROW, "start": "2024-01-01T00:00:00"}], "timezone"),
        ([{**_ROW, "sum": float("nan")}], "invalid JSON data"),
        ([{**_ROW, "unexpected": 1}], "unknown fields"),
        ([{**_ROW, "start": "2024-01-01T00:30:00+00:00"}], "on the hour"),
    ],
)
def test_rejects_malformed_or_unsafe_rows(rows, message) -> None:
    with pytest.raises(TransferFormatError, match=message):
        parse_transfer_package(_package(rows))


def test_rejects_unknown_versions_and_inconsistent_metadata() -> None:
    package = _package()
    package["format_version"] = 2
    with pytest.raises(TransferFormatError, match="unsupported"):
        parse_transfer_package(package)

    package = _package()
    package["source"]["has_mean"] = True
    with pytest.raises(TransferFormatError, match="inconsistent"):
        parse_transfer_package(package)


def test_rejects_empty_or_excessively_large_packages() -> None:
    with pytest.raises(TransferFormatError, match="no hourly rows"):
        parse_transfer_package(_package([]))
    with pytest.raises(TransferFormatError, match="row limit"):
        build_transfer_package(
            "sensor.old_energy_meter",
            {
                "unit_of_measurement": "kWh",
                "unit_class": "energy",
                "has_sum": True,
                "mean_type": 0,
            },
            [{}] * 250_001,
        )
