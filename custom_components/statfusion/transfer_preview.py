"""Read-only compatibility analysis for an imported statistics package."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from .analyzer import analyze_merge
from .models import (
    AnalysisDecision,
    AnalysisFinding,
    FindingSeverity,
    MergeAnalysis,
    StatisticSnapshot,
)
from .transfer_format import TransferPackage


def analyze_transfer_preview(
    package: TransferPackage,
    target: StatisticSnapshot,
    target_rows: list[dict[str, Any]],
) -> tuple[MergeAnalysis, int]:
    """Compare an external export to the destination without writing data."""
    source_info = package.source
    source = StatisticSnapshot(
        statistic_id=source_info["statistic_id"],
        unit_of_measurement=source_info["unit_of_measurement"],
        unit_class=source_info["unit_class"],
        has_mean=source_info["has_mean"],
        has_sum=source_info["has_sum"],
        first=package.rows[0]["start"],
        last=package.rows[-1]["start"],
        sample_count=len(package.rows),
        mean_type=source_info["mean_type"],
    )
    initial = analyze_merge(source, target, allow_same_statistic_id=True)
    findings = list(initial.findings)

    if source.unit_class != target.unit_class:
        findings.append(
            AnalysisFinding(
                "unit_class_mismatch",
                FindingSeverity.ERROR,
                "Source and target use different or unknown unit classes.",
            )
        )

    source_starts = {row["start"] for row in package.rows}
    target_starts = {_row_start(row["start"]) for row in target_rows}
    collisions = len(source_starts & target_starts)
    if collisions:
        findings = [
            finding for finding in findings if finding.code != "time_range_overlap"
        ]
        findings.append(
            AnalysisFinding(
                "transfer_timestamp_collision",
                FindingSeverity.ERROR,
                f"{collisions} source hour(s) already exist in the destination.",
            )
        )

    decision = (
        AnalysisDecision.BLOCKED
        if any(finding.severity is FindingSeverity.ERROR for finding in findings)
        else AnalysisDecision.READY_FOR_REVIEW
    )
    return MergeAnalysis(source, target, decision, tuple(findings)), collisions


def _row_start(value: datetime | float | int) -> datetime:
    """Normalize a raw Recorder hour start to aware UTC."""
    if isinstance(value, datetime):
        return value.astimezone(UTC)
    return datetime.fromtimestamp(value, tz=UTC)
