"""Pure compatibility checks for a long-term statistics merge."""

from __future__ import annotations

from datetime import timedelta

from .models import (
    AnalysisDecision,
    AnalysisFinding,
    FindingSeverity,
    MergeAnalysis,
    StatisticSnapshot,
)

_ENERGY_FLOW_KEYWORDS = {
    "export": ("abgabe", "einspeis", "export", "feed_in", "feedin"),
    "import": ("bezug", "import", "grid_import"),
}


def analyze_merge(
    source: StatisticSnapshot,
    target: StatisticSnapshot,
    *,
    allow_same_statistic_id: bool = False,
) -> MergeAnalysis:
    """Produce a read-only compatibility analysis for source and target.

    It checks whether source rows can safely append to the target. The
    same-statistic-ID exception is intended only for a validated export from a
    different installation. This function never writes to the recorder.
    """
    findings: list[AnalysisFinding] = []

    if source.statistic_id == target.statistic_id and not allow_same_statistic_id:
        findings.append(
            _error(
                "same_statistic_id",
                "Source and target must be different statistics.",
            )
        )

    _check_presence(source, "source", findings)
    _check_presence(target, "target", findings)
    _check_statistic_shape(source, "source", findings)
    _check_statistic_shape(target, "target", findings)

    if source.first and target.first:
        _check_shape_match(source, target, findings)
        _check_units(source, target, findings)
        _check_energy_flow(source, target, findings)
        _check_time_range(source, target, findings)
        if source.has_sum:
            findings.append(
                AnalysisFinding(
                    "sum_baseline_discontinuity",
                    FindingSeverity.WARNING,
                    "Cumulative values are copied as recorded. Different source "
                    "and target baselines may appear as a visible jump; values "
                    "are not adjusted or added together.",
                )
            )

    decision = (
        AnalysisDecision.BLOCKED
        if any(finding.severity is FindingSeverity.ERROR for finding in findings)
        else AnalysisDecision.READY_FOR_REVIEW
    )
    return MergeAnalysis(source, target, decision, tuple(findings))


def _check_presence(
    snapshot: StatisticSnapshot,
    role: str,
    findings: list[AnalysisFinding],
) -> None:
    """Report a statistic that lacks metadata or hourly samples."""
    if snapshot.first is None or snapshot.last is None or snapshot.sample_count == 0:
        findings.append(
            _error(
                f"{role}_statistics_missing",
                f"The {role} statistic '{snapshot.statistic_id}' has no hourly "
                "long-term statistics to analyze.",
            )
        )


def _check_statistic_shape(
    snapshot: StatisticSnapshot,
    role: str,
    findings: list[AnalysisFinding],
) -> None:
    """Require a mean or a sum statistic shape."""
    if not snapshot.has_mean and not snapshot.has_sum:
        findings.append(
            _error(
                f"{role}_statistic_type_unsupported",
                f"The {role} statistic '{snapshot.statistic_id}' has neither mean "
                "nor sum data.",
            )
        )


def _check_shape_match(
    source: StatisticSnapshot,
    target: StatisticSnapshot,
    findings: list[AnalysisFinding],
) -> None:
    """Require the same statistic columns and mean calculation method."""
    if (source.has_mean, source.has_sum) != (target.has_mean, target.has_sum):
        findings.append(
            _error(
                "statistic_type_mismatch",
                "Source and target use different statistic types and cannot be "
                "combined safely.",
            )
        )
    elif source.mean_type != target.mean_type:
        findings.append(
            _error(
                "statistic_mean_type_mismatch",
                "Source and target use different mean calculation methods and "
                "cannot be merged safely.",
            )
        )


def _check_units(
    source: StatisticSnapshot,
    target: StatisticSnapshot,
    findings: list[AnalysisFinding],
) -> None:
    """Check units conservatively without converting any values."""
    if source.unit_of_measurement == target.unit_of_measurement:
        return
    if source.unit_class and source.unit_class == target.unit_class:
        findings.append(
            AnalysisFinding(
                "unit_conversion_required",
                FindingSeverity.ERROR,
                "Source and target use different units. The merge cannot preserve "
                "recorded values unchanged without unit conversion.",
            )
        )
        return
    findings.append(
        _error(
            "unit_mismatch",
            "Source and target use incompatible or unknown units.",
        )
    )


def _check_energy_flow(
    source: StatisticSnapshot,
    target: StatisticSnapshot,
    findings: list[AnalysisFinding],
) -> None:
    """Warn when statistic IDs clearly describe opposing energy flows.

    Entity names are not authoritative metadata, so this stays a warning. It
    prevents an otherwise technically compatible comparison from looking like
    an unqualified merge candidate.
    """
    source_flow = _energy_flow_for(source.statistic_id)
    target_flow = _energy_flow_for(target.statistic_id)
    if source_flow is None or target_flow is None or source_flow == target_flow:
        return

    findings.append(
        AnalysisFinding(
            "energy_flow_mismatch",
            FindingSeverity.WARNING,
            "Source and target appear to describe opposing energy flows. Review "
            "their meaning before the merge.",
        )
    )


def _energy_flow_for(statistic_id: str) -> str | None:
    """Infer only unambiguous import/export hints from a statistic ID."""
    normalized = statistic_id.lower()
    for flow, keywords in _ENERGY_FLOW_KEYWORDS.items():
        if any(keyword in normalized for keyword in keywords):
            return flow
    return None


def _check_time_range(
    source: StatisticSnapshot,
    target: StatisticSnapshot,
    findings: list[AnalysisFinding],
) -> None:
    """Describe overlaps for explicit per-hour resolution and note time gaps."""
    assert source.last is not None
    assert source.first is not None
    assert target.first is not None
    if target.first < source.first:
        findings.append(
            _error(
                "time_range_target_starts_before_source",
                "The target statistic starts before the source statistic. Select "
                "the older statistic as the source and the newer statistic as "
                "the target.",
            )
        )
        return

    if target.first <= source.last:
        findings.append(
            AnalysisFinding(
                "time_range_overlap",
                FindingSeverity.WARNING,
                "Source and target have overlapping time ranges. Review the exact "
                "hours that exist in both statistics and choose which values to "
                "keep.",
            )
        )
        return

    if target.first - source.last > timedelta(hours=1):
        findings.append(
            AnalysisFinding(
                "time_range_gap",
                FindingSeverity.WARNING,
                "There is a gap between the source and target statistics ranges. "
                "Review the gap before the merge.",
            )
        )
        return

    findings.append(
        AnalysisFinding(
            "time_range_contiguous",
            FindingSeverity.INFO,
            "The source ends immediately before the target begins.",
        )
    )


def _error(code: str, message: str) -> AnalysisFinding:
    """Create a blocking finding."""
    return AnalysisFinding(code, FindingSeverity.ERROR, message)
