# Cross-installation statistics transfer (planned for 1.1.0)

## Goal

Move selected hourly long-term statistics from an older Home Assistant
installation into the matching entity statistic on a newer installation. The
two installations do not connect to each other. The user exports a file on the
old installation and imports it on the new one.

This is a separate workflow from the existing same-installation merge. It does
not copy recorder databases or short-term state history. Home Assistant stores
long-term statistics in Recorder and provides recorder helpers for importing
hourly statistics; database migration itself is not a supported substitute for
this selective transfer.

## User flow

1. On the old installation, choose one supported entity statistic and export
   its long-term hourly rows to a StatFusion JSON file.
2. On the new installation, select that file and choose the existing target
   entity statistic.
3. StatFusion validates the file and target, then shows a read-only preview:
   source identity and metadata, target identity and metadata, date ranges,
   number of hours, gaps, overlap, and any compatibility findings.
4. If the transfer is allowed, the user creates and confirms a full backup,
   reviews the warnings, and explicitly confirms the write.
5. StatFusion imports the source hours unchanged under the target statistic.
   The original export file and all existing target hours remain untouched.
6. StatFusion rereads the target and verifies each imported hour. The result
   reports success only after verification.

The file can be moved manually by download/upload or removable media; StatFusion
does not need credentials, a network route, or an API token for the old
installation.

## Transfer file contract

Use a versioned UTF-8 JSON object. The initial format should contain only the
data required to validate and import one statistic:

```json
{
  "format": "statfusion-statistics",
  "format_version": 1,
  "exported_at": "2026-10-01T12:00:00+00:00",
  "source": {
    "statistic_id": "sensor.old_energy_meter",
    "unit_of_measurement": "kWh",
    "unit_class": "energy",
    "has_sum": true,
    "has_mean": false,
    "mean_type": "0"
  },
  "rows": [
    {
      "start": "2024-01-01T00:00:00+00:00",
      "last_reset": null,
      "state": 120.5,
      "sum": 120.5
    }
  ]
}
```

Rows retain the raw Recorder values and UTC hour starts. Optional fields such as
`mean`, `min`, `max`, `mean_weight`, and `last_reset` are included only when
present. `mean_type` is the Recorder mean-type code serialized as text (for
example, `"0"` when mean statistics are absent). The export must not contain entity states, credentials, host details,
or unrelated statistics. A format version is mandatory so future versions can
reject or explicitly migrate incompatible files.

## Import safety rules

- Treat every uploaded file as untrusted input. Validate the format/version,
  metadata types, finite numeric values, UTC timestamps, unique hour starts,
  chronological order, and a reasonable file/row size limit before analysis.
- Require a supported entity-statistic target that exists in the destination
  Recorder. Keep the destination's Recorder metadata; never create a new
  statistic from imported metadata.
- Compare unit, unit class, sum/mean shape, and mean calculation type. Do not
  convert units or normalize cumulative values in the first release.
- Block any timestamp collision. Preserve all existing target hours and all
  source data. Show gaps and energy-flow hints as review warnings.
- Recheck the target immediately before writing. Require independent backup,
  warning-review, and explicit-write confirmations, matching the existing
  merge safeguards.
- Import only through Home Assistant Recorder APIs. Do not open or modify
  SQLite/SQLAlchemy database files directly.
- Reread imported hours and compare every supported value before reporting
  success. If verification fails, report an error and direct the user to the
  backup; do not claim rollback unless the Recorder API provides one.

## Implementation slices

1. [x] Add the versioned export package builder/parser and strict validation tests.
2. [x] Add an admin-only authenticated export endpoint and a panel download
   control. The download uses HTTP so larger multi-year exports do not have to
   fit in a single WebSocket service response. This exports the old
   installation's data; the destination import flow is still being built.
3. [x] Add panel file selection, target mapping, and read-only import preview.
4. Add the confirmed import action, collision/recheck safeguards, and
   post-import verification.
5. Add German and English help, format documentation, and Home Assistant
   version compatibility checks.

Each slice must use Recorder's supported statistics helpers and retain the
existing same-installation merge behavior. The source statistic ID in an
external file is descriptive only: the destination target is selected
separately, even if both installations happen to use the same ID.

## Compatibility note

Home Assistant's Recorder import metadata evolves. Keep the on-disk format
independent of transient Recorder internals, then construct import metadata
from the destination statistic after compatibility checks. Test against the
minimum supported Home Assistant version and current Core; update this adapter
when Core changes required metadata fields.
