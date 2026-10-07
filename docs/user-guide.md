# StatFusion user guide

StatFusion analyzes and copies Home Assistant Recorder long-term statistics.
Use it when an old entity is being replaced by a new one and you want the new
entity's history to include the old entity's hourly values.

## Before you start

- Create a full Home Assistant backup and verify that it includes the Recorder
  database. Back up an external Recorder database separately.
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

- **Wrong order:** the merge is blocked. Select the older statistic as source
  and the newer one as target.
- **Overlapping hours:** review the exact count and time range. For identical
  hourly timestamps, choose whether the old source values or new target values
  should remain. Missing source hours are still added either way; all other
  target hours and the source statistic remain unchanged. You can cancel before
  writing. Source values are unavailable as a choice if Recorder cannot safely
  replace the stored mean weight for those rows.
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

StatFusion rechecks the statistics and the exact set of overlapping hours
immediately before writing. It applies the selected rule only to identical hourly timestamps,
adds missing source hours, preserves the source, waits for Recorder, and
verifies the resulting rows. Values are copied as stored; sums are not added
or normalized. Restore the backup if the result is not what you expected.

## Transfer statistics between Home Assistant installations (1.1.0)

StatFusion 1.1.0 can move one statistic's hourly long-term data from an older
installation to a newer one. The installations do not connect: the source
installation downloads a JSON export, which you transfer manually to the target
installation.

1. On the source installation, choose the statistic and select **Export source**.
2. On the target installation, choose the existing destination statistic, select
   the exported JSON file, and create the import preview.
3. Review the source and target, units, data type, time range, gaps, and findings.
   A source and target with the same ID can still be separate statistics on
   different installations.
4. Create a full Home Assistant backup and verify that it includes the Recorder
   database; back up an external Recorder database separately. Confirm the backup,
   review the warnings and mapping, then explicitly confirm the import.
5. Wait for the verified completion result.

StatFusion blocks incompatible statistics and any hour that already exists in
the target. It does not overwrite existing target hours, convert units, or
change the exported values. Keep the export file until you have checked the
target history. The JSON can contain sensitive household usage history; store
and transfer it accordingly. Imports are limited to 250,000 hourly rows and a
64 MiB file.

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
  collision_resolution: target # required only when hourly timestamps overlap
```

The dashboard follows Home Assistant's language setting and currently
supports German and English. Analysis history is kept only for the current
dashboard session.
