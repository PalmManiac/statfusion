# Changelog

## 1.1.0 – Unreleased

- Export one statistic's hourly long-term data to a portable JSON file and
  transfer it between Home Assistant installations.
- Preview compatibility on the target installation, then import only after
  backup, warning-review, and explicit confirmation.
- Block incompatible metadata and existing hourly timestamps; verify imported
  values through Recorder before reporting success.
- Add German and English transfer instructions and declare Home Assistant
  2024.10.0 as the minimum supported version.
- End-to-end testing on a running Home Assistant instance remains pending.

## 1.0.0 – Initial release

- Add an administrator-only sidebar dashboard for searching and comparing
  long-term statistics.
- Analyze statistic types, units, time ranges, overlaps, gaps, and possible
  energy-flow mismatches without changing Recorder data.
- Copy missing hourly source values into a target after backup and explicit
  confirmation; preserve source values and existing target rows.
- Verify imported Recorder rows and report merge completion or failure.
- Include German and English dashboard text, session-only analysis history,
  and Home Assistant brand assets.
