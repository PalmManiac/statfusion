"""Pure compatibility checks for a future statistics merge."""

from __future__ import annotations

from datetime import timedelta

from .models import (
    AnalysisDecision,
    AnalysisFinding,
    FindingSeverity,
    MergeAnalysis,
    StatisticSnapshot,
)


def analyze_merge(
    source: StatisticSnapshot, target: StatisticSnapshot
) -> MergeAnalysis:
    """Produce a read-only compatibility analysis for source and target.

    The function intentionally describes only whether a later merge warrants
    review. It neither calculates replacement statistics nor writes to the
    recorder.
    """
    findings: list[AnalysisFinding] = []

    if source.statistic_id == target.statistic_id:
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
        _check_time_range(source, target, findings)

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
    """Require the same statistics columns for a future merge."""
    if (source.has_mean, source.has_sum) != (target.has_mean, target.has_sum):
        findings.append(
            _error(
                "statistic_type_mismatch",
                "Source and target use different statistic types and cannot be "
                "combined safely.",
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
                FindingSeverity.WARNING,
                "Source and target use different units in the same unit class. A "
                "future merge would need a separately validated unit conversion.",
            )
        )
        return
    findings.append(
        _error(
            "unit_mismatch",
            "Source and target use incompatible or unknown units.",
        )
    )


def _check_time_range(
    source: StatisticSnapshot,
    target: StatisticSnapshot,
    findings: list[AnalysisFinding],
) -> None:
    """Reject overlaps and make non-contiguous handoffs explicit."""
    assert source.last is not None
    assert target.first is not None
    if target.first <= source.last:
        findings.append(
            _error(
                "time_range_overlap",
                "Source and target contain overlapping long-term-statistics time "
                "ranges.",
            )
        )
        return

    if target.first - source.last > timedelta(hours=1):
        findings.append(
            AnalysisFinding(
                "time_range_gap",
                FindingSeverity.WARNING,
                "There is a gap between the source and target statistics ranges. "
                "Review the gap before any future merge.",
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
