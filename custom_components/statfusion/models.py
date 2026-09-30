"""Domain models for long-term statistics analysis and transfer."""

from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import datetime
from enum import StrEnum


class FindingSeverity(StrEnum):
    """Severity of an analysis finding."""

    ERROR = "error"
    WARNING = "warning"
    INFO = "info"


class AnalysisDecision(StrEnum):
    """Possible outcomes of a statistics merge analysis."""

    BLOCKED = "blocked"
    READY_FOR_REVIEW = "ready_for_review"


@dataclass(frozen=True, slots=True)
class StatisticSnapshot:
    """The metadata and hourly range observed for one statistic."""

    statistic_id: str
    unit_of_measurement: str | None
    unit_class: str | None
    has_mean: bool
    has_sum: bool
    first: datetime | None
    last: datetime | None
    sample_count: int
    mean_type: str = "none"

    def as_dict(self) -> dict[str, object]:
        """Return a JSON-ready snapshot."""
        data = asdict(self)
        data["first"] = self.first.isoformat() if self.first else None
        data["last"] = self.last.isoformat() if self.last else None
        return data


@dataclass(frozen=True, slots=True)
class AnalysisFinding:
    """One human-readable result of the compatibility check."""

    code: str
    severity: FindingSeverity
    message: str

    def as_dict(self) -> dict[str, str]:
        """Return a JSON-ready finding."""
        return {
            "code": self.code,
            "severity": self.severity.value,
            "message": self.message,
        }


@dataclass(frozen=True, slots=True)
class MergeAnalysis:
    """The findings from a statistics merge analysis."""

    source: StatisticSnapshot
    target: StatisticSnapshot
    decision: AnalysisDecision
    findings: tuple[AnalysisFinding, ...]

    def as_dict(self) -> dict[str, object]:
        """Return the analysis as a service response."""
        return {
            "analysis_only": True,
            "decision": self.decision.value,
            "source": self.source.as_dict(),
            "target": self.target.as_dict(),
            "findings": [finding.as_dict() for finding in self.findings],
            "summary": _summary_for(self.decision),
        }


def _summary_for(decision: AnalysisDecision) -> str:
    """Return the result statement shown to a caller."""
    if decision is AnalysisDecision.BLOCKED:
        return (
            "No merge plan was produced because the selected statistics are not "
            "compatible. No recorder data was changed."
        )
    return (
        "The selected statistics passed the technical checks and are ready for "
        "explicit confirmation. "
        "No recorder data was changed."
    )
