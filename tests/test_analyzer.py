"""Tests for StatFusion's pure read-only merge analysis."""

from datetime import UTC, datetime, timedelta

from custom_components.statfusion.analyzer import analyze_merge
from custom_components.statfusion.models import AnalysisDecision, StatisticSnapshot


def _snapshot(
    statistic_id: str,
    *,
    first: datetime | None = datetime(2026, 1, 1, tzinfo=UTC),
    last: datetime | None = datetime(2026, 1, 1, 23, tzinfo=UTC),
    unit: str | None = "kWh",
    unit_class: str | None = "energy",
    has_mean: bool = False,
    has_sum: bool = True,
) -> StatisticSnapshot:
    return StatisticSnapshot(
        statistic_id=statistic_id,
        unit_of_measurement=unit,
        unit_class=unit_class,
        has_mean=has_mean,
        has_sum=has_sum,
        first=first,
        last=last,
        sample_count=24 if first else 0,
    )


def _finding_codes(analysis) -> set[str]:
    return {finding.code for finding in analysis.findings}


def test_contiguous_total_statistics_are_ready_for_review() -> None:
    source = _snapshot("sensor.old_energy")
    target = _snapshot(
        "sensor.new_energy",
        first=source.last + timedelta(hours=1),
        last=source.last + timedelta(hours=24),
    )

    analysis = analyze_merge(source, target)

    assert analysis.decision is AnalysisDecision.READY_FOR_REVIEW
    assert "time_range_contiguous" in _finding_codes(analysis)
    assert analysis.as_dict()["analysis_only"] is True


def test_overlapping_ranges_are_blocked() -> None:
    source = _snapshot("sensor.old_energy")
    target = _snapshot("sensor.new_energy", first=source.last)

    analysis = analyze_merge(source, target)

    assert analysis.decision is AnalysisDecision.BLOCKED
    assert "time_range_overlap" in _finding_codes(analysis)


def test_incompatible_statistic_types_are_blocked() -> None:
    source = _snapshot("sensor.old_energy")
    target = _snapshot("sensor.new_temperature", has_mean=True, has_sum=False)

    analysis = analyze_merge(source, target)

    assert analysis.decision is AnalysisDecision.BLOCKED
    assert "statistic_type_mismatch" in _finding_codes(analysis)


def test_convertible_units_need_review_but_are_not_silently_rejected() -> None:
    source = _snapshot("sensor.old_energy", unit="Wh")
    target = _snapshot(
        "sensor.new_energy",
        first=source.last + timedelta(hours=1),
        last=source.last + timedelta(hours=24),
        unit="kWh",
    )

    analysis = analyze_merge(source, target)

    assert analysis.decision is AnalysisDecision.READY_FOR_REVIEW
    assert "unit_conversion_required" in _finding_codes(analysis)


def test_missing_statistics_are_blocked() -> None:
    source = _snapshot("sensor.old_energy", first=None, last=None)
    target = _snapshot("sensor.new_energy")

    analysis = analyze_merge(source, target)

    assert analysis.decision is AnalysisDecision.BLOCKED
    assert "source_statistics_missing" in _finding_codes(analysis)


def test_gaps_are_reported_for_review() -> None:
    source = _snapshot("sensor.old_energy")
    target = _snapshot(
        "sensor.new_energy",
        first=source.last + timedelta(hours=3),
        last=source.last + timedelta(hours=27),
    )

    analysis = analyze_merge(source, target)

    assert analysis.decision is AnalysisDecision.READY_FOR_REVIEW
    assert "time_range_gap" in _finding_codes(analysis)


def test_opposing_energy_flows_need_semantic_review() -> None:
    source = _snapshot("sensor.stromzahler_abgabe")
    target = _snapshot(
        "sensor.shelly_energie_bezug_kwh",
        first=source.last + timedelta(hours=1),
        last=source.last + timedelta(hours=24),
    )

    analysis = analyze_merge(source, target)

    assert analysis.decision is AnalysisDecision.READY_FOR_REVIEW
    assert "energy_flow_mismatch" in _finding_codes(analysis)


def test_matching_energy_flows_do_not_create_a_semantic_warning() -> None:
    source = _snapshot("sensor.stromzahler_bezug")
    target = _snapshot(
        "sensor.shelly_energie_bezug_kwh",
        first=source.last + timedelta(hours=1),
        last=source.last + timedelta(hours=24),
    )

    assert "energy_flow_mismatch" not in _finding_codes(analyze_merge(source, target))
