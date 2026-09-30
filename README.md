![GitHub Release](https://img.shields.io/github/v/release/PalmManiac/statfusion?style=for-the-badge)
![Maintained](https://img.shields.io/badge/Maintained-Yes-green?style=for-the-badge)
![GitHub Repo Size](https://img.shields.io/github/repo-size/PalmManiac/statfusion?style=for-the-badge)
[![Active installs](https://badge.t-haber.de/badge/statfusion?kill_cache=1)](https://github.com/PalmManiac/statfusion/)
![GitHub Stars](https://img.shields.io/github/stars/PalmManiac/statfusion?style=for-the-badge)
![License](https://img.shields.io/github/license/PalmManiac/statfusion?style=for-the-badge)
![HACS](https://img.shields.io/badge/HACS-Default-blue?style=for-the-badge)

# StatFusion

StatFusion is a Home Assistant tool for safely analyzing how long-term
statistics can be carried from one entity to another after an entity or device
change.

## Current status

StatFusion analyzes two long-term statistics and can copy the source's hourly
history into the target after a full Home Assistant backup and explicit
confirmation. The source is preserved. Existing target hours are preserved,
and any timestamp overlap or unit conversion requirement blocks the operation.

## Planned first workflow

1. Select a source entity and a target entity.
2. Inspect statistic type, unit, time range, and possible overlap.
3. Show gaps, cumulative-baseline jumps, and other review warnings.
4. Copy only non-overlapping hourly rows without changing their values.

## Installation during development

Copy `custom_components/statfusion` into the `custom_components` directory of
a Home Assistant development instance, then restart Home Assistant. Add
**StatFusion** from **Settings → Devices & services**.

StatFusion creates no entities and has no background polling. Historical data
is only changed by the separate, administrator-only merge action.

## Sidebar analysis

After the integration is added, **StatFusion** appears as an admin-only entry
in the Home Assistant sidebar. The page provides searchable source and target
statistic selection and presents the read-only result as a compact
compatibility report. The result also visualizes the time transition between
source and target, including any gap or overlap, and summarizes the technical,
energy-flow, and time-range checks. It follows the active Home Assistant theme
and can copy the displayed analysis as plain text. It does not offer any action
that changes statistics. The last five analyses remain visible only for the
current open panel session and can restore their source and target selection.
The result uses a compact two-column layout on wider displays; the session
history and the standard preparation plan can be expanded when needed.

## Analyze a possible merge

The sidebar is the preferred way to analyze and merge. The administrator-only
`statfusion.analyze` action also remains available in Home Assistant's
Developer Tools. Supply the older and newer statistic IDs:

```yaml
action: statfusion.analyze
data:
  source_statistic_id: sensor.old_energy
  target_statistic_id: sensor.new_energy
```

The action returns metadata, time ranges, and compatibility findings. A
`ready_for_review` result does not itself start a merge.

## Merge historical statistics

After analysis, the panel requires a full Home Assistant backup and a separate
confirmation before calling `statfusion.merge`. The merge rechecks both
statistics immediately before writing, blocks any overlapping hourly timestamp
or unit conversion, copies the source values into the target, waits for the
recorder to finish, and verifies the copied rows. Source rows and existing target
rows remain unchanged. Values are copied as recorded; StatFusion does not add or
normalize cumulative sums. Different cumulative baselines may therefore appear
as a visible jump. A time gap or possible energy-flow mismatch also needs review
before confirmation.

The merge action is admin-only and also requires both explicit confirmations
when called from Developer Tools:

```yaml
action: statfusion.merge
data:
  source_statistic_id: sensor.old_energy
  target_statistic_id: sensor.new_energy
  backup_confirmed: true
  confirm: true
```

## Project principles

- Keep all statistics operations database-backend independent.
- Prefer Home Assistant recorder interfaces over direct SQLite access.
- Analyze first; require explicit confirmation for writes.
- Treat a full Home Assistant backup as a prerequisite for historical writes.

## Development

The repository uses HACS and Home Assistant hassfest validation in GitHub
Actions. Python style checks are configured in `pyproject.toml`.

## License

StatFusion is licensed under the [Apache License 2.0](LICENSE).
