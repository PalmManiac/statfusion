# StatFusion

StatFusion is a Home Assistant tool for safely analyzing how long-term
statistics can be carried from one entity to another after an entity or device
change.

## Current status

The initial release is intentionally analysis-only. It will inspect a selected
source and target, report their compatibility and time ranges, and prepare a
human-readable migration plan. It does not modify Home Assistant statistics,
statistics metadata, or the recorder database.

## Planned first workflow

1. Select a source entity and a target entity.
2. Inspect statistic type, unit, time range, and possible overlap.
3. Show a plan explaining whether a later merge could be safe.
4. Require an explicit confirmation and a Home Assistant backup before any
   future write feature is considered.

## Installation during development

Copy `custom_components/statfusion` into the `custom_components` directory of
a Home Assistant development instance, then restart Home Assistant. Add
**StatFusion** from **Settings → Devices & services**.

The current scaffold creates no entities, has no background polling, and makes
no recorder or database changes.

## Analyze a possible merge

After adding the integration, use the `statfusion.analyze` action in Home
Assistant's Developer Tools. Supply the older and newer statistic IDs:

```yaml
action: statfusion.analyze
data:
  source_statistic_id: sensor.old_energy
  target_statistic_id: sensor.new_energy
```

The action returns the source and target metadata, their hourly time ranges,
and findings such as an overlap, a gap, a statistic-type mismatch, or a unit
conversion requirement. A `ready_for_review` result is only an analysis
result; it never authorizes or performs a recorder change.

## Project principles

- Keep all statistics operations database-backend independent.
- Prefer Home Assistant recorder interfaces over direct SQLite access.
- Analyze first; make any future write operation explicit, reviewable, and
  separately tested.
- Treat a Home Assistant backup as a prerequisite for any future operation
  that can alter historical data.

## Development

The repository uses HACS and Home Assistant hassfest validation in GitHub
Actions. Python style checks are configured in `pyproject.toml`.

## License

StatFusion is licensed under the [Apache License 2.0](LICENSE).
