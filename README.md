![GitHub Release](https://img.shields.io/github/v/release/PalmManiac/statfusion?style=for-the-badge)
![Maintained](https://img.shields.io/badge/Maintained-Yes-green?style=for-the-badge)
![GitHub Repo Size](https://img.shields.io/github/repo-size/PalmManiac/statfusion?style=for-the-badge)
[![Active installs](https://badge.t-haber.de/badge/statfusion?kill_cache=1)](https://github.com/PalmManiac/statfusion/)
![GitHub Stars](https://img.shields.io/github/stars/PalmManiac/statfusion?style=for-the-badge)
![License](https://img.shields.io/github/license/PalmManiac/statfusion?style=for-the-badge)
[![HACS Default](https://img.shields.io/badge/HACS-Default-orange.svg?style=for-the-badge)](https://github.com/custom-components/hacs)

# StatFusion

StatFusion is a Home Assistant integration for reviewing and merging hourly
long-term statistics when replacing an entity or device. Starting with version
1.1.0, it also transfers selected statistics between installations through a
validated file export and import. It provides an administrator-only sidebar
dashboard, a read-only compatibility analysis, and separately confirmed writes.

- [English user guide](docs/user-guide.md)
- [Deutsche Anleitung](docs/anleitung.md)
- [Cross-install transfer format and safety](docs/cross-install-transfer.md)

## What StatFusion changes

Analysis never writes to Recorder. A merge copies source hourly rows into the
target only when the target has no row at those timestamps. It preserves the
source and existing target rows, copies recorded values without recalculating
cumulative sums, waits for Recorder, and verifies the imported rows.

Overlapping time ranges, incompatible statistic types, and unit conversions
block a merge. Time gaps, possible opposite energy flows, and cumulative
baseline differences are warnings for the user to review; a result marked
**Ready for review** is not an instruction to merge. A full Home Assistant
backup is required. Historical Recorder changes are made at the user's own
risk.

## Installation

StatFusion is available in the default HACS catalog:

1. In Home Assistant, open **HACS** and search for **StatFusion**.
2. Open StatFusion and select **Download**.
3. Restart Home Assistant to load the integration.
4. Add **StatFusion** from **Settings → Devices & services**. Its dashboard
   appears in the sidebar for administrators.

## Development

The repository runs Ruff, pytest, HACS validation, and Home Assistant hassfest
in GitHub Actions. The manifest version follows semantic versioning.

## License

StatFusion is licensed under the [Apache License 2.0](LICENSE).
