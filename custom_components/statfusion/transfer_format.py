"""Versioned file format for moving hourly statistics between installations."""

from __future__ import annotations

import json
import math
from collections.abc import Mapping
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

FORMAT = "statfusion-statistics"
FORMAT_VERSION = 1
MAX_TRANSFER_ROWS = 250_000
MAX_TRANSFER_BYTES = 64 * 1024 * 1024
_SOURCE_FIELDS = {
    "statistic_id",
    "unit_of_measurement",
    "unit_class",
    "has_sum",
    "has_mean",
    "mean_type",
}
_ROW_FIELDS = {
    "start",
    "last_reset",
    "state",
    "sum",
    "min",
    "max",
    "mean",
    "mean_weight",
}
_NUMERIC_FIELDS = {"state", "sum", "min", "max", "mean", "mean_weight"}


class TransferFormatError(ValueError):
    """Raised when an imported transfer package is malformed or unsupported."""


@dataclass(frozen=True, slots=True)
class TransferPackage:
    """Validated source metadata and hourly rows from a transfer file."""

    exported_at: datetime
    source: dict[str, Any]
    rows: tuple[dict[str, Any], ...]


def build_transfer_package(
    statistic_id: str,
    metadata: Mapping[str, Any],
    rows: list[Mapping[str, Any]],
    *,
    exported_at: datetime | None = None,
) -> dict[str, Any]:
    """Build a JSON-safe package containing one statistic and raw hourly rows."""
    if len(rows) > MAX_TRANSFER_ROWS:
        raise TransferFormatError("The statistic exceeds the supported row limit.")

    source = {
        "statistic_id": statistic_id,
        "unit_of_measurement": metadata.get("unit_of_measurement"),
        "unit_class": metadata.get("unit_class"),
        "has_sum": bool(metadata.get("has_sum")),
        "has_mean": bool(int(metadata.get("mean_type", 0))),
        "mean_type": str(int(metadata.get("mean_type", 0))),
    }
    package = {
        "format": FORMAT,
        "format_version": FORMAT_VERSION,
        "exported_at": _iso_utc(exported_at or datetime.now(UTC)),
        "source": source,
        "rows": [_serialize_row(row) for row in rows],
    }
    # Run the same checks on exports and imports so only files we can read back
    # are emitted for users to transfer.
    parse_transfer_package(package)
    return package


def parse_transfer_package(value: str | bytes | Mapping[str, Any]) -> TransferPackage:
    """Decode and strictly validate one untrusted transfer package."""
    if isinstance(value, (str, bytes)):
        raw_size = (
            len(value) if isinstance(value, bytes) else len(value.encode("utf-8"))
        )
        if raw_size > MAX_TRANSFER_BYTES:
            raise TransferFormatError(
                "The transfer file exceeds the supported size limit."
            )
        try:
            value = json.loads(value)
        except (json.JSONDecodeError, UnicodeDecodeError) as err:
            raise TransferFormatError("The transfer file is not valid JSON.") from err
    if not isinstance(value, Mapping):
        raise TransferFormatError("The transfer package must be a JSON object.")
    try:
        raw_size = len(
            json.dumps(value, ensure_ascii=False, allow_nan=False).encode("utf-8")
        )
    except (TypeError, ValueError) as err:
        raise TransferFormatError(
            "The transfer package contains invalid JSON data."
        ) from err
    if raw_size > MAX_TRANSFER_BYTES:
        raise TransferFormatError("The transfer file exceeds the supported size limit.")
    if value.get("format") != FORMAT:
        raise TransferFormatError("The file is not a StatFusion statistics export.")
    if set(value) != {"format", "format_version", "exported_at", "source", "rows"}:
        raise TransferFormatError("The transfer package has missing or unknown fields.")
    version = value.get("format_version")
    if type(version) is not int or version != FORMAT_VERSION:
        raise TransferFormatError("This StatFusion transfer format is unsupported.")

    exported_at = _parse_timestamp(value.get("exported_at"), "exported_at")
    source_value = value.get("source")
    if not isinstance(source_value, Mapping):
        raise TransferFormatError("Source metadata is missing or invalid.")
    source = _validate_source(source_value)
    rows_value = value.get("rows")
    if not isinstance(rows_value, list) or not rows_value:
        raise TransferFormatError("The transfer file contains no hourly rows.")
    if len(rows_value) > MAX_TRANSFER_ROWS:
        raise TransferFormatError("The statistic exceeds the supported row limit.")

    rows: list[dict[str, Any]] = []
    previous_start: datetime | None = None
    for index, item in enumerate(rows_value):
        row = _validate_row(item, index)
        start = row["start"]
        if previous_start is not None and start <= previous_start:
            raise TransferFormatError(
                "Hourly rows must have unique, ascending timestamps."
            )
        previous_start = start
        rows.append(row)

    return TransferPackage(exported_at, source, tuple(rows))


def _validate_source(value: Mapping[str, Any]) -> dict[str, Any]:
    if set(value) != _SOURCE_FIELDS:
        raise TransferFormatError("Source metadata has missing or unknown fields.")
    statistic_id = value["statistic_id"]
    if not isinstance(statistic_id, str) or not statistic_id.strip():
        raise TransferFormatError("Source statistic ID is missing.")
    for field in ("unit_of_measurement", "unit_class"):
        if value[field] is not None and not isinstance(value[field], str):
            raise TransferFormatError(f"Source {field} must be text or null.")
    if type(value["has_sum"]) is not bool or type(value["has_mean"]) is not bool:
        raise TransferFormatError("Source statistic shape is invalid.")
    if not value["has_sum"] and not value["has_mean"]:
        raise TransferFormatError("Source statistic has no supported values.")
    if (
        not isinstance(value["mean_type"], str)
        or not value["mean_type"].isascii()
        or not value["mean_type"].isdigit()
    ):
        raise TransferFormatError("Source mean type is invalid.")
    if value["has_mean"] != (int(value["mean_type"]) != 0):
        raise TransferFormatError("Source mean metadata is inconsistent.")
    return dict(value)


def _validate_row(value: Any, index: int) -> dict[str, Any]:
    if not isinstance(value, Mapping) or "start" not in value:
        raise TransferFormatError(f"Hourly row {index + 1} is invalid.")
    if set(value) - _ROW_FIELDS:
        raise TransferFormatError(f"Hourly row {index + 1} has unknown fields.")
    row = dict(value)
    row["start"] = _parse_timestamp(row["start"], f"row {index + 1} start")
    if row["start"].minute or row["start"].second or row["start"].microsecond:
        raise TransferFormatError("Hourly timestamps must start on the hour.")
    if "last_reset" in row and row["last_reset"] is not None:
        row["last_reset"] = _parse_timestamp(
            row["last_reset"], f"row {index + 1} last_reset"
        )
    for field in _NUMERIC_FIELDS & row.keys():
        number = row[field]
        if isinstance(number, bool) or not isinstance(number, (int, float)):
            raise TransferFormatError(f"Hourly row {index + 1} has invalid {field}.")
        if not math.isfinite(number):
            raise TransferFormatError(f"Hourly row {index + 1} has non-finite {field}.")
    return row


def _parse_timestamp(value: Any, field: str) -> datetime:
    if not isinstance(value, str):
        raise TransferFormatError(f"Timestamp {field} must include a timezone.")
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as err:
        raise TransferFormatError(f"Timestamp {field} is invalid.") from err
    if parsed.tzinfo is None or parsed.utcoffset() is None:
        raise TransferFormatError(f"Timestamp {field} must include a timezone.")
    return parsed.astimezone(UTC)


def _serialize_row(value: Mapping[str, Any]) -> dict[str, Any]:
    row = {key: value[key] for key in _ROW_FIELDS if key in value}
    row["start"] = _iso_utc(_as_utc_datetime(row["start"]))
    if isinstance(row.get("last_reset"), datetime):
        row["last_reset"] = _iso_utc(_as_utc_datetime(row["last_reset"]))
    elif isinstance(row.get("last_reset"), (float, int)):
        row["last_reset"] = _iso_utc(datetime.fromtimestamp(row["last_reset"], tz=UTC))
    return row


def _as_utc_datetime(value: Any) -> datetime:
    if isinstance(value, datetime):
        if value.tzinfo is None or value.utcoffset() is None:
            raise TransferFormatError("Recorder timestamps must include a timezone.")
        return value.astimezone(UTC)
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return datetime.fromtimestamp(value, tz=UTC)
    if isinstance(value, str):
        return _parse_timestamp(value, "row timestamp")
    raise TransferFormatError("Recorder timestamp has an unsupported type.")


def _iso_utc(value: datetime) -> str:
    if value.tzinfo is None or value.utcoffset() is None:
        raise TransferFormatError("Timestamps must include a timezone.")
    return value.astimezone(UTC).isoformat()
