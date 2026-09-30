# StatFusion user guide

StatFusion analyzes and copies Home Assistant Recorder long-term statistics.
Use it when an old entity is being replaced by a new one and you want the new
entity's history to include the old entity's hourly values.

## Before you start

- Create a full Home Assistant backup and make sure it is available for
  restoration.
- Identify the older statistic as the **source** and the statistic that should
  receive its missing hours as the **target**.
- Confirm that both statistics represent the same measurement and energy flow.

StatFusion changes historical Recorder data permanently. Use it at your own
risk. The project team cannot accept liability for data loss or consequential
damage to the extent permitted by law.

## Analyze a source and target

1. Open **StatFusion** from the Home Assistant sidebar.
2. Choose a source and target statistic. Enter a statistic ID or select **List**
   to search available statistics.
3. Select **Check compatibility**.
4. Review both time ranges, data type, unit, energy-flow assessment, and all
   findings.

Analysis is read-only. A result marked **Ready for review** only means that no
blocking technical issue was detected. It does not mean the histories have the
same meaning or that every warning is safe to ignore.

### Findings that need attention

- **Overlap or wrong order:** the merge is blocked. Select an older source and
  a newer target with no overlapping statistics range.
- **Unit conversion or incompatible statistic types:** the merge is blocked;
  StatFusion never converts values.
- **Time gap:** the merge can proceed after review, but the missing period stays
  missing.
- **Possible opposite energy flows:** verify that the statistic IDs really
  describe the same flow before continuing.
- **Cumulative baseline difference:** values are copied as recorded. StatFusion
  does not add or normalize sums, so a visible jump may remain.

## Merge the hourly values

Proceed only after reviewing the findings and confirming the source/target
selection:

1. Confirm that the full Home Assistant backup is complete and available.
2. Acknowledge the backup, review warnings, and confirm the selected mapping.
3. Select **Merge hourly values** and approve the final browser confirmation.
4. Wait for the success result and check the target's history.

StatFusion rechecks the statistics immediately before writing. It copies the
source rows only if none of their timestamps already exist in the target,
preserves the source and existing target rows, waits for Recorder, and verifies
the imported rows. If even one timestamp already exists in the target or
verification fails, the action reports an error. Restore the backup if the
result is not what you expected.

## Developer Tools actions

Administrators can run the analysis action from **Developer Tools → Actions**.
This action does not write Recorder data:

```yaml
action: statfusion.analyze
data:
  source_statistic_id: sensor.old_energy
  target_statistic_id: sensor.new_energy
```

The merge action requires all explicit confirmations and repeats the safety
checks immediately before writing:

```yaml
action: statfusion.merge
data:
  source_statistic_id: sensor.old_energy
  target_statistic_id: sensor.new_energy
  backup_confirmed: true
  warnings_confirmed: true
  confirm: true
```

The dashboard follows Home Assistant's language setting and currently
supports German and English. Analysis history is kept only for the current
dashboard session.
