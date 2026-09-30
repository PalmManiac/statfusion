const escapeHtml = (value) => String(value == null ? "" : value).replace(/[&<>"]/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "\"": "&quot;",
})[character]);

const FINDING_MESSAGES = {
  same_statistic_id: "Quelle und Ziel müssen unterschiedliche Statistiken sein.",
  source_statistics_missing: "Die Quellstatistik enthält keine stündlichen Langzeitstatistiken.",
  target_statistics_missing: "Die Zielstatistik enthält keine stündlichen Langzeitstatistiken.",
  source_statistic_type_unsupported: "Die Quellstatistik enthält weder Summen- noch Mittelwertdaten.",
  target_statistic_type_unsupported: "Die Zielstatistik enthält weder Summen- noch Mittelwertdaten.",
  statistic_type_mismatch: "Quelle und Ziel verwenden unterschiedliche Datenformen und können nicht sicher zusammengeführt werden.",
  unit_conversion_required: "Quelle und Ziel verwenden unterschiedliche Einheiten. Die Übernahme ist blockiert, damit keine Umrechnung oder Wertänderung erfolgt.",
  statistic_mean_type_mismatch: "Quelle und Ziel verwenden unterschiedliche Mittelwertverfahren.",
  sum_baseline_discontinuity: "Kumulative Werte werden unverändert kopiert. Unterschiedliche Ausgangswerte können als sichtbarer Sprung erscheinen; Werte werden weder angepasst noch addiert.",
  unit_mismatch: "Quelle und Ziel verwenden nicht passende oder unbekannte Einheiten.",
  energy_flow_mismatch: "Quelle und Ziel scheinen entgegengesetzte Energieflüsse zu beschreiben. Prüfe ihre Bedeutung vor einer späteren Übernahme.",
  time_range_target_starts_before_source: "Das Ziel beginnt zeitlich vor der Quelle. Wähle die ältere Statistik als Quelle und die neuere als Ziel.",
  time_range_overlap: "Quelle und Ziel enthalten überlappende Zeiträume in der Langzeitstatistik.",
  time_range_gap: "Zwischen Quelle und Ziel besteht eine Zeitlücke. Prüfe die Lücke vor einer späteren Übernahme.",
  time_range_contiguous: "Die Quelle endet unmittelbar vor Beginn des Ziels.",
};

const REVIEW_PLAN_STEPS = {
  energy_flow_mismatch: "Den Energiefluss von Quelle und Ziel fachlich bestätigen.",
  time_range_gap: "Die angezeigte Zeitlücke fachlich prüfen und dokumentieren.",
  unit_conversion_required: "Die erforderliche Einheitenumrechnung fachlich und technisch prüfen.",
  sum_baseline_discontinuity: "Mögliche sichtbare Sprünge durch unterschiedliche Ausgangswerte berücksichtigen.",
};

class StatFusionPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._statistics = [];
    this._source = "";
    this._target = "";
    this._result = null;
    this._error = "";
    this._copyStatus = "";
    this._loading = false;
    this._statisticsLoading = false;
    this._pickerRole = "";
    this._pickerQuery = "";
    this._analysisHistory = [];
    this._mergeLoading = false;
    this._mergeResult = null;
    this._mergeError = "";
  }

  set hass(value) {
    this._hass = value;
    if (!this._statistics.length && !this._statisticsLoading) {
      this._loadStatistics();
    }
    if (!this.shadowRoot.innerHTML) this._render();
  }

  get hass() {
    return this._hass;
  }

  async _loadStatistics() {
    if (!this._hass || !this._hass.connection || !this._hass.connection.sendMessagePromise) return;
    this._statisticsLoading = true;
    try {
      const result = await this._hass.connection.sendMessagePromise({
        type: "recorder/list_statistic_ids",
      });
      this._statistics = result
        .map((item) => typeof item === "string" ? item : item.statistic_id)
        .filter(Boolean)
        .sort((left, right) => left.localeCompare(right));
    } catch (error) {
      this._error = "Die verfügbaren Statistiken konnten nicht geladen werden.";
    } finally {
      this._statisticsLoading = false;
    }
    this._render();
  }

  async _analyze() {
    const source = this.shadowRoot.querySelector("#source").value.trim();
    const target = this.shadowRoot.querySelector("#target").value.trim();
    this._source = source;
    this._target = target;
    this._error = "";
    this._result = null;
    this._copyStatus = "";
    this._mergeResult = null;
    this._mergeError = "";

    if (!source || !target) {
      this._error = "Bitte wähle eine Quell- und eine Zielstatistik aus.";
      this._render();
      return;
    }

    this._loading = true;
    this._render();
    try {
      const response = await this._hass.connection.sendMessagePromise({
        type: "call_service",
        domain: "statfusion",
        service: "analyze",
        service_data: {
          source_statistic_id: source,
          target_statistic_id: target,
        },
        return_response: true,
      });
      this._result = response.response !== undefined
        ? response.response
        : (response.service_response !== undefined ? response.service_response : response);
      this._rememberAnalysis();
    } catch (error) {
      this._error = "Die Analyse konnte nicht ausgeführt werden. Bitte prüfe die Auswahl.";
    } finally {
      this._loading = false;
      this._render();
    }
  }

  _formatDate(value) {
    if (!value) return "Keine Daten";
    const language = this._hass && this._hass.locale ? this._hass.locale.language : "de-DE";
    return new Intl.DateTimeFormat(language, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  }

  _statisticCard(title, snapshot, tone) {
    if (!snapshot) return "";
    const types = [snapshot.has_sum ? "Summe" : "", snapshot.has_mean ? "Mittelwert" : ""]
      .filter(Boolean)
      .join(" · ") || "Unbekannt";
    return `
      <article class="stat-card ${tone}">
        <div class="card-label">${title}</div>
        <strong>${escapeHtml(snapshot.statistic_id)}</strong>
        <dl>
          <div><dt>Zeitraum</dt><dd>${escapeHtml(this._formatDate(snapshot.first))} – ${escapeHtml(this._formatDate(snapshot.last))}</dd></div>
          <div><dt>Datenform</dt><dd>${escapeHtml(types)}</dd></div>
          <div><dt>Einheit</dt><dd>${escapeHtml(snapshot.unit_of_measurement || "Unbekannt")}</dd></div>
          <div><dt>Stundenwerte</dt><dd>${snapshot.sample_count == null ? 0 : snapshot.sample_count}</dd></div>
        </dl>
      </article>`;
  }

  async _merge() {
    const backupConfirmed = this.shadowRoot.querySelector("#backup-confirmed").checked;
    const warningsConfirmed = this.shadowRoot.querySelector("#warnings-confirmed").checked;
    const mergeConfirmed = this.shadowRoot.querySelector("#merge-confirmed").checked;
    if (!backupConfirmed || !warningsConfirmed || !mergeConfirmed || !this._result || this._result.decision === "blocked") return;

    this._mergeLoading = true;
    this._mergeResult = null;
    this._mergeError = "";
    this._render();
    try {
      const response = await this._hass.connection.sendMessagePromise({
        type: "call_service",
        domain: "statfusion",
        service: "merge",
        service_data: {
          source_statistic_id: this._source,
          target_statistic_id: this._target,
          confirm: true,
          backup_confirmed: true,
          warnings_confirmed: true,
        },
        return_response: true,
      });
      this._mergeResult = response.response !== undefined
        ? response.response
        : (response.service_response !== undefined ? response.service_response : response);
    } catch (error) {
      this._mergeError = "Die Übernahme wurde blockiert oder konnte nicht bestätigt werden. Prüfe die Hinweise und Recorder-Protokolle, bevor du es erneut versuchst.";
    } finally {
      this._mergeLoading = false;
      this._render();
    }
  }

  _rememberAnalysis() {
    if (!this._result || !this._source || !this._target) return;
    const entry = {
      source: this._source,
      target: this._target,
      decision: this._result.decision,
    };
    this._analysisHistory = [
      entry,
      ...this._analysisHistory.filter((item) => item.source !== entry.source || item.target !== entry.target),
    ].slice(0, 5);
  }

  _reuseAnalysis(entry) {
    this._source = entry.source;
    this._target = entry.target;
    this._result = null;
    this._error = "";
    this._copyStatus = "";
    this._render();
  }

  _historyTemplate() {
    if (!this._analysisHistory.length) return "";
    return `
      <details class="analysis-history" aria-label="Letzte Prüfungen">
        <summary><span><span class="eyebrow">Sitzung</span>Letzte Prüfungen</span><span>${this._analysisHistory.length} in dieser Ansicht</span></summary>
        <div class="history-list">${this._analysisHistory.map((entry, index) => `
          <article class="history-entry ${entry.decision === "blocked" ? "blocked" : "ready"}">
            <div><strong>${escapeHtml(entry.source)}</strong><span>→</span><strong>${escapeHtml(entry.target)}</strong></div>
            <div class="history-actions"><span>${entry.decision === "blocked" ? "Blockiert" : "Zur Übernahme bereit"}</span><button type="button" class="reuse-analysis" data-history-index="${index}">Auswahl übernehmen</button></div>
          </article>`).join("")}</div>
      </details>`;
  }

  async _copyResult() {
    if (!this._result || !navigator.clipboard) return;

    const status = this._result.decision === "blocked" ? "Nicht bereit" : "Bereit zur Prüfung";
    const findings = (this._result.findings || [])
      .map((finding) => `- ${FINDING_MESSAGES[finding.code] || finding.message}`);
    const text = [
      "StatFusion – Analyse",
      `Status: ${status}`,
      `Quelle: ${this._result.source.statistic_id}`,
      `Ziel: ${this._result.target.statistic_id}`,
      `Quelle Zeitraum: ${this._formatDate(this._result.source.first)} – ${this._formatDate(this._result.source.last)}`,
      `Ziel Zeitraum: ${this._formatDate(this._result.target.first)} – ${this._formatDate(this._result.target.last)}`,
      "Hinweise:",
      ...(findings.length ? findings : ["- Keine Hinweise"]),
      "",
      "Die Analyse verändert keine Daten.",
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      this._copyStatus = "Analyse kopiert";
    } catch (error) {
      this._copyStatus = "Kopieren nicht möglich";
    }
    this._render();
  }

  _formatDuration(milliseconds) {
    const hours = Math.max(0, Math.round(milliseconds / (60 * 60 * 1000)));
    if (hours < 24) return `${hours} Stunden`;
    const days = Math.round(hours / 24);
    return `${days} ${days === 1 ? "Tag" : "Tage"}`;
  }

  _timelineTemplate() {
    const source = this._result.source;
    const target = this._result.target;
    if (!source || !target || !source.first || !source.last || !target.first) return "";

    const sourceStart = new Date(source.first);
    const sourceEnd = new Date(source.last);
    const targetStart = new Date(target.first);
    if (Number.isNaN(sourceStart.valueOf()) || Number.isNaN(sourceEnd.valueOf()) || Number.isNaN(targetStart.valueOf())) return "";

    const difference = targetStart.valueOf() - sourceEnd.valueOf();
    const relation = targetStart <= sourceStart ? "reversed" : difference < 0 ? "overlap" : difference > 60 * 60 * 1000 ? "gap" : "contiguous";
    const relationLabel = relation === "reversed" ? "Falsche Reihenfolge" : relation === "overlap" ? "Überlappung" : relation === "gap" ? "Zeitlücke" : "Direkter Übergang";
    const relationDescription = relation === "reversed"
      ? "Das Ziel beginnt vor der Quelle. Wähle die ältere Statistik als Quelle."
      : relation === "overlap"
      ? `Quelle und Ziel überlappen sich um ${this._formatDuration(Math.abs(difference))}.`
      : relation === "gap"
        ? `Zwischen Quelle und Ziel liegt eine Zeitlücke von ${this._formatDuration(difference)}.`
        : "Quelle und Ziel schließen zeitlich direkt aneinander an.";

    return `
      <section class="timeline ${relation}" aria-label="Zeitlicher Übergang">
        <div class="timeline-heading"><span class="eyebrow">Zeitraum</span><strong>Zeitlicher Übergang</strong></div>
        <div class="timeline-track" aria-hidden="true">
          <div class="timeline-segment source">Quelle</div><div class="timeline-connector"></div><div class="timeline-segment target">Ziel</div>
        </div>
        <div class="timeline-details">
          <div><span>Quelle endet</span><strong>${escapeHtml(this._formatDate(source.last))}</strong></div>
          <div class="timeline-relation"><span>${relationLabel}</span><strong>${escapeHtml(relationDescription)}</strong></div>
          <div><span>Ziel beginnt</span><strong>${escapeHtml(this._formatDate(target.first))}</strong></div>
        </div>
      </section>`;
  }

  _assessmentTemplate() {
    const findings = this._result.findings || [];
    const hasError = findings.some((finding) => finding.severity === "error");
    const flowMismatch = findings.some((finding) => finding.code === "energy_flow_mismatch");
    const timeFinding = findings.find((finding) => finding.code.startsWith("time_range_"));
    const hasTimeRange = this._result.source.first && this._result.source.last
      && this._result.target.first && this._result.target.last;
    const technical = hasError
      ? { tone: "error", title: "Technik", value: "Blockiert", detail: "Mindestens eine technische Voraussetzung fehlt." }
      : { tone: "good", title: "Technik", value: "Geprüft", detail: "Keine blockierende technische Abweichung erkannt." };
    const semantics = flowMismatch
      ? { tone: "warning", title: "Energiefluss", value: "Prüfen", detail: "Quelle und Ziel könnten unterschiedliche Flüsse beschreiben." }
      : { tone: "good", title: "Energiefluss", value: "Kein Hinweis", detail: "Die Statistik-IDs liefern keinen gegenteiligen Flusshinweis." };
    const timeline = !hasTimeRange
      ? { tone: "neutral", title: "Zeitraum", value: "Nicht verfügbar", detail: "Für mindestens eine Statistik fehlen Zeitbereichsdaten." }
      : timeFinding && timeFinding.code === "time_range_target_starts_before_source"
      ? { tone: "error", title: "Zeitraum", value: "Falsche Reihenfolge", detail: "Das Ziel muss nach der Quelle beginnen." }
      : timeFinding && timeFinding.code === "time_range_overlap"
      ? { tone: "error", title: "Zeitraum", value: "Überlappung", detail: "Die Zeiträume können nicht direkt aneinander anschließen." }
      : timeFinding && timeFinding.code === "time_range_gap"
        ? { tone: "warning", title: "Zeitraum", value: "Lücke", detail: "Die Lücke muss vor einer späteren Übernahme geprüft werden." }
        : { tone: "good", title: "Zeitraum", value: "Direkter Übergang", detail: "Quelle und Ziel schließen zeitlich direkt aneinander an." };

    return `
      <section class="assessment" aria-label="Prüfstatus">
        <div class="assessment-heading"><span class="eyebrow">Auf einen Blick</span><strong>Prüfstatus</strong></div>
        <div class="assessment-grid">
          ${[technical, semantics, timeline].map((item) => `
            <article class="assessment-card ${item.tone}">
              <span>${item.title}</span><strong>${item.value}</strong><p>${item.detail}</p>
            </article>`).join("")}
        </div>
      </section>`;
  }

  _resultTemplate() {
    if (!this._result) return "";
    const blocked = this._result.decision === "blocked";
    const status = blocked ? "Nicht bereit" : "Bereit zur Übernahme";
    const findings = (this._result.findings || []).map((finding) => `
      <li class="finding ${finding.severity}">
        <span>${finding.severity === "error" ? "!" : finding.severity === "warning" ? "!" : "i"}</span>
        ${escapeHtml(FINDING_MESSAGES[finding.code] || finding.message)}
      </li>`).join("");
    return `
      <section class="result ${blocked ? "blocked" : "ready"}">
        <div class="result-heading">
          <div><span class="eyebrow">Prüfung</span><h2>${status}</h2></div>
          <div class="result-actions"><span class="chip">${this._result.analysis_only ? "Keine Änderungen" : ""}</span><button class="copy-result" id="copy-result" type="button">Analyse kopieren</button></div>
        </div>
        ${this._copyStatus ? `<p class="copy-status" aria-live="polite">${escapeHtml(this._copyStatus)}</p>` : ""}
        <p>${blocked ? "Die ausgewählten Statistiken sind technisch nicht kompatibel. Es wurde kein Übernahmeplan erstellt und keine Recorder-Daten wurden verändert." : "Die ausgewählten Statistiken können als möglicher Kandidat für eine spätere Übernahme geprüft werden. Es wurden keine Recorder-Daten verändert."}</p>
        <div class="result-layout">
          <div class="result-primary">
            ${this._assessmentTemplate()}
            ${this._timelineTemplate()}
            <ul class="findings">${findings}</ul>
          </div>
          <div class="result-secondary">
            <div class="stat-grid">
              ${this._statisticCard("Quelle", this._result.source, "source")}
              ${this._statisticCard("Ziel", this._result.target, "target")}
            </div>
            ${this._reviewPlanTemplate(blocked)}
            ${this._mergeTemplate(blocked)}
          </div>
        </div>
      </section>`;
  }

  _reviewPlanTemplate(blocked) {
    if (blocked) {
      return `
        <section class="review-plan blocked-plan">
          <span class="eyebrow">Nächster Schritt</span>
          <h2>Kein Übernahmeplan verfügbar</h2>
          <p>Die blockierenden Hinweise müssen zuerst geklärt werden. Es wurden keine Daten verändert.</p>
        </section>`;
    }

    const warningSteps = (this._result.findings || [])
      .filter((finding) => finding.severity === "warning")
      .map((finding) => REVIEW_PLAN_STEPS[finding.code] || "Den angezeigten Hinweis vor einer späteren Übernahme prüfen.");
    const steps = [
      ...new Set(warningSteps),
      "Die fachliche Zuordnung von Quelle und Ziel bestätigen.",
    ];
    return `
      <details class="review-plan" ${warningSteps.length ? "open" : ""}>
        <summary><span><span class="eyebrow">Vorschau</span>Übernahmeplan zur Prüfung</span><span>${warningSteps.length ? "Hinweise prüfen" : "Vorbereitung"}</span></summary>
        <p>Die Übernahme kopiert die Quellstunden unverändert ins Ziel. Quellwerte und bestehende Zielstunden bleiben erhalten.</p>
        <ol>${steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol>
      </details>`;
  }

  _mergeTemplate(blocked) {
    if (blocked || !this._result || this._mergeResult) {
      if (this._mergeResult) {
        return `<section class="merge-result success"><strong>Übernahme abgeschlossen</strong><p>${escapeHtml(this._mergeResult.summary || "Die Recorder-Prüfung wurde abgeschlossen.")}</p><p>Übernommene Stunden: ${Number(this._mergeResult.imported_hours) || 0}</p></section>`;
      }
      return "";
    }
    return `
      <section class="merge-confirmation">
        <span class="eyebrow">Letzter Schritt</span><h2>Stundenwerte übernehmen</h2>
        <p>StatFusion ergänzt ausschließlich fehlende Stunden im Ziel. Die Quelle und bereits vorhandene Zielstunden bleiben unverändert. Werte werden nicht addiert oder umgerechnet.</p>
        <label class="confirm-check"><input id="backup-confirmed" type="checkbox"><span>Ich habe vor der Übernahme eine vollständige Home-Assistant-Sicherung erstellt.</span></label>
        <label class="confirm-check"><input id="warnings-confirmed" type="checkbox"><span>Ich habe alle Warnhinweise geprüft, insbesondere mögliche Sprünge bei kumulativen Werten.</span></label>
        <label class="confirm-check"><input id="merge-confirmed" type="checkbox"><span>Ich bestätige die Zuordnung und möchte die angezeigten Quellstunden ins Ziel kopieren.</span></label>
        <button id="merge" type="button" ${this._mergeLoading ? "disabled" : ""}>${this._mergeLoading ? "Recorder übernimmt …" : "Stundenwerte übernehmen"}</button>
        ${this._mergeError ? `<p class="merge-error" role="alert">${escapeHtml(this._mergeError)}</p>` : ""}
      </section>`;
  }

  _render() {
    if (!this.shadowRoot) return;
    const options = this._statistics.map((id) => `<option value="${escapeHtml(id)}"></option>`).join("");
    this.shadowRoot.innerHTML = `
      <style>
        :host { display:block; min-height:100%; color:var(--primary-text-color); background:var(--primary-background-color); font-family:var(--primary-font-family, sans-serif); }
        main { max-width:1240px; margin:0 auto; padding:22px 24px 36px; }
        header { display:flex; gap:16px; justify-content:space-between; align-items:flex-start; margin-bottom:18px; }
        h1,h2,p { margin:0; } h1 { font-size:27px; line-height:1.2; letter-spacing:-0.02em; } h2 { font-size:20px; line-height:1.25; }
        .subtitle { color:var(--secondary-text-color); font-size:15px; margin-top:5px; }
        .chip { background:var(--secondary-background-color); border-radius:18px; color:var(--secondary-text-color); font-size:13px; font-weight:600; padding:7px 12px; white-space:nowrap; }
        .workspace,.result { background:var(--card-background-color); border:1px solid var(--divider-color); border-radius:12px; box-shadow:var(--ha-card-box-shadow, none); padding:17px; }
        .workspace-title { display:flex; gap:12px; align-items:center; justify-content:space-between; margin-bottom:13px; } .eyebrow,.card-label { color:var(--secondary-text-color); font-size:11px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; }
        .selection { display:grid; grid-template-columns:1fr 42px 1fr; gap:12px; align-items:end; }
        label { color:var(--secondary-text-color); display:grid; font-size:14px; font-weight:600; gap:7px; } input { box-sizing:border-box; background:var(--input-fill-color, var(--secondary-background-color)); border:1px solid var(--input-idle-line-color, var(--divider-color)); border-radius:8px; color:var(--primary-text-color); font:inherit; padding:12px; width:100%; } input:focus { border-color:var(--primary-color); outline:2px solid color-mix(in srgb, var(--primary-color) 25%, transparent); }.input-row { display:flex; gap:8px; }.input-row input { min-width:0; }.picker-trigger { background:var(--secondary-background-color); border:1px solid var(--divider-color); border-radius:8px; color:var(--primary-text-color); cursor:pointer; font:inherit; font-weight:700; padding:0 12px; white-space:nowrap; }.picker-trigger:hover { border-color:#0878d1; color:#0878d1; }.arrow { color:var(--primary-color); font-size:25px; line-height:45px; text-align:center; }
        .actions { display:flex; align-items:center; gap:14px; margin-top:14px; } #analyze { appearance:none; background:#0878d1; border:0; border-radius:8px; box-shadow:0 1px 2px rgb(0 0 0 / 18%); color:#fff; cursor:pointer; font:inherit; font-weight:700; padding:10px 15px; } #analyze:hover { background:#0669b6; } #analyze:focus-visible { outline:3px solid color-mix(in srgb, #0878d1 35%, transparent); outline-offset:2px; } #analyze:disabled { background:#6c8cab; cursor:wait; opacity:1; } .read-only { color:var(--secondary-text-color); font-size:13px; }
        .error { background:var(--error-color); border-radius:8px; color:var(--text-primary-color, white); margin-top:16px; padding:11px 13px; } .result { border-top:3px solid var(--primary-color); margin-top:22px; } .result.blocked { border-top-color:var(--error-color); } .result-heading,.result-actions { align-items:center; display:flex; justify-content:space-between; } .result-actions { gap:9px; }.copy-result { background:transparent; border:1px solid var(--divider-color); border-radius:7px; color:var(--primary-text-color); cursor:pointer; font:inherit; font-size:13px; font-weight:700; padding:7px 10px; }.copy-result:hover { border-color:#0878d1; color:#0878d1; }.copy-result:focus-visible { outline:3px solid color-mix(in srgb, #0878d1 35%, transparent); outline-offset:2px; }.result.ready .chip { color:var(--success-color, #2e7d32); } .result p { color:var(--secondary-text-color); margin-top:8px; }.copy-status { color:var(--success-color, #2e7d32); font-size:13px; font-weight:700; }
        .result-layout { display:grid; grid-template-columns:minmax(0, 1.2fr) minmax(300px, .8fr); gap:14px; margin-top:14px; }.result-primary,.result-secondary { align-content:start; display:grid; gap:12px; }.result-layout .assessment,.result-layout .timeline,.result-layout .stat-grid,.result-layout .findings,.result-layout .review-plan { margin-top:0; }.result-layout .assessment-grid { gap:8px; margin-top:8px; }.result-layout .assessment-card { min-height:76px; padding:11px; }.result-layout .assessment-card strong { font-size:16px; }.result-layout .assessment-card p { font-size:12px; line-height:1.3; margin-top:4px; }.result-layout .timeline { padding:13px; }.result-layout .timeline-track { margin-top:11px; }.result-layout .timeline-details { gap:8px; margin-top:9px; }.result-layout .timeline-details strong { font-size:12px; }.result-layout .stat-grid { grid-template-columns:1fr; gap:8px; }.result-layout .stat-card { padding:12px; }.result-layout .stat-card strong { font-size:13px; }.result-layout dl { gap:6px; grid-template-columns:1fr 1fr; margin-top:9px; }.result-layout dl div { display:grid; gap:2px; justify-content:initial; }.result-layout dd { text-align:left; }.result-layout .findings { gap:6px; }.result-layout .finding { font-size:13px; padding:9px; }
        .analysis-history { background:var(--card-background-color); border:1px solid var(--divider-color); border-radius:10px; box-shadow:var(--ha-card-box-shadow, none); margin-top:12px; padding:0 14px; }.analysis-history summary,.review-plan summary { align-items:center; cursor:pointer; display:flex; gap:14px; justify-content:space-between; list-style:none; padding:13px 0; }.analysis-history summary::-webkit-details-marker,.review-plan summary::-webkit-details-marker { display:none; }.analysis-history summary > span:first-child,.review-plan summary > span:first-child { font-size:15px; font-weight:700; }.analysis-history summary .eyebrow,.review-plan summary .eyebrow { display:block; margin-bottom:2px; }.analysis-history summary > span:last-child,.review-plan summary > span:last-child { color:var(--secondary-text-color); font-size:12px; text-align:right; }.history-list { border-top:1px solid var(--divider-color); display:grid; gap:7px; padding:10px 0 13px; }.history-entry { align-items:center; background:var(--secondary-background-color); border-left:3px solid var(--primary-color); border-radius:8px; display:flex; gap:12px; justify-content:space-between; padding:9px 10px; }.history-entry.blocked { border-left-color:var(--error-color); }.history-entry > div:first-child { align-items:center; display:flex; font-family:var(--code-font-family, monospace); font-size:12px; gap:7px; min-width:0; }.history-entry strong { overflow-wrap:anywhere; }.history-entry > div:first-child span { color:var(--secondary-text-color); }.history-actions { align-items:center; display:flex; flex:0 0 auto; gap:9px; }.history-actions > span { color:var(--secondary-text-color); font-size:11px; }.reuse-analysis { background:transparent; border:1px solid var(--divider-color); border-radius:7px; color:var(--primary-text-color); cursor:pointer; font:inherit; font-size:12px; font-weight:700; padding:6px 8px; }.reuse-analysis:hover { border-color:#0878d1; color:#0878d1; }
        .stat-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:20px; }.stat-card { background:var(--secondary-background-color); border:1px solid var(--divider-color); border-radius:9px; border-top:3px solid var(--primary-color); padding:16px; }.stat-card.target { border-top-color:var(--accent-color, #00a7d8); }.stat-card strong { display:block; font-family:var(--code-font-family, monospace); font-size:15px; margin-top:6px; overflow-wrap:anywhere; } dl { display:grid; gap:9px; margin:16px 0 0; } dl div { display:flex; gap:12px; justify-content:space-between; } dt { color:var(--secondary-text-color); } dd { margin:0; text-align:right; }
        .assessment { margin-top:20px; }.assessment-heading { display:flex; flex-direction:column; gap:4px; }.assessment-heading strong { font-size:17px; }.assessment-grid { display:grid; gap:12px; grid-template-columns:repeat(3, 1fr); margin-top:12px; }.assessment-card { background:var(--secondary-background-color); border:1px solid var(--divider-color); border-left:3px solid var(--primary-color); border-radius:9px; padding:14px; }.assessment-card.warning { border-left-color:var(--warning-color, #f6a700); }.assessment-card.error { border-left-color:var(--error-color); }.assessment-card span { color:var(--secondary-text-color); display:block; font-size:12px; font-weight:700; letter-spacing:.05em; text-transform:uppercase; }.assessment-card strong { display:block; font-size:17px; margin-top:4px; }.assessment-card p { font-size:13px; line-height:1.4; margin-top:6px; }
        .timeline { background:var(--secondary-background-color); border:1px solid var(--divider-color); border-radius:9px; margin-top:20px; padding:16px; }.timeline-heading { display:flex; flex-direction:column; gap:4px; }.timeline-heading strong { font-size:17px; }.timeline-track { align-items:center; display:grid; grid-template-columns:minmax(0, 1fr) 54px minmax(0, 1fr); margin-top:16px; }.timeline-segment { background:#0878d1; border-radius:6px; color:#fff; font-size:13px; font-weight:700; padding:10px 12px; text-align:center; }.timeline-segment.target { background:var(--accent-color, #00a7d8); }.timeline-connector { background:var(--primary-color); height:4px; }.timeline.gap .timeline-connector { background:var(--warning-color, #f6a700); }.timeline.overlap .timeline-connector,.timeline.reversed .timeline-connector { background:var(--error-color); }.timeline-details { display:grid; gap:12px; grid-template-columns:1fr 1.25fr 1fr; margin-top:13px; }.timeline-details div { display:grid; gap:3px; }.timeline-details div:last-child { text-align:right; }.timeline-details span { color:var(--secondary-text-color); font-size:12px; }.timeline-details strong { font-size:13px; }.timeline-relation { text-align:center; }.timeline-relation strong { font-family:var(--primary-font-family, sans-serif); }
        .findings { display:grid; gap:8px; list-style:none; margin:20px 0 0; padding:0; }.finding { align-items:flex-start; background:var(--secondary-background-color); border-radius:8px; display:flex; gap:10px; padding:11px; }.finding span { align-items:center; background:var(--primary-color); border-radius:50%; color:white; display:inline-flex; flex:0 0 19px; font-size:12px; font-weight:700; height:19px; justify-content:center; }.finding.error span { background:var(--error-color); }.finding.warning span { background:var(--warning-color, #f6a700); }
        .review-plan { background:var(--secondary-background-color); border-left:3px solid #0878d1; border-radius:8px; padding:0 14px; }.review-plan.blocked-plan { border-left-color:var(--error-color); padding:14px; }.review-plan h2 { font-size:18px; margin-top:4px; }.review-plan p { color:var(--secondary-text-color); margin-top:0; }.review-plan ol { display:grid; gap:7px; margin:0; padding:11px 0 14px 21px; }.review-plan li { padding-left:3px; }.review-plan > p { border-top:1px solid var(--divider-color); padding-top:11px; }
        .merge-confirmation,.merge-result { background:var(--secondary-background-color); border:1px solid var(--divider-color); border-left:3px solid #0878d1; border-radius:9px; padding:14px; }.merge-confirmation h2 { font-size:18px; margin-top:4px; }.merge-confirmation > p,.merge-result p { color:var(--secondary-text-color); line-height:1.4; margin-top:8px; }.confirm-check { align-items:flex-start; color:var(--primary-text-color); display:flex; font-size:13px; font-weight:500; gap:9px; margin-top:12px; }.confirm-check input { accent-color:#0878d1; flex:0 0 auto; margin:2px 0 0; width:auto; }.merge-confirmation button { background:#0878d1; border:0; border-radius:8px; color:white; cursor:pointer; font:inherit; font-weight:700; margin-top:14px; padding:10px 14px; }.merge-confirmation button:disabled { cursor:wait; opacity:.65; }.merge-result.success { border-left-color:var(--success-color, #2e7d32); }.merge-result strong { color:var(--success-color, #2e7d32); }.merge-error { color:var(--error-color); }
        .picker-backdrop { align-items:center; background:rgb(0 0 0 / 35%); display:flex; inset:0; justify-content:center; padding:20px; position:fixed; z-index:10; }.picker { background:var(--card-background-color); border:1px solid var(--divider-color); border-radius:12px; box-shadow:0 16px 40px rgb(0 0 0 / 28%); max-width:660px; padding:22px; width:100%; }.picker-heading { align-items:flex-start; display:flex; justify-content:space-between; margin-bottom:17px; }.close-picker { background:transparent; border:0; color:var(--secondary-text-color); cursor:pointer; font-size:28px; line-height:28px; padding:0 5px; }.picker-count { color:var(--secondary-text-color); font-size:13px; margin:11px 0; }.picker-options { border:1px solid var(--divider-color); border-radius:8px; max-height:420px; overflow:auto; }.picker-option { background:transparent; border:0; border-bottom:1px solid var(--divider-color); color:var(--primary-text-color); cursor:pointer; display:flex; font-family:var(--code-font-family, monospace); font-size:14px; font-weight:400; justify-content:space-between; padding:13px; text-align:left; width:100%; }.picker-option:hover { background:var(--secondary-background-color); }.picker-option span:last-child { color:#0878d1; font-family:var(--primary-font-family, sans-serif); font-size:12px; font-weight:700; }.picker-option:last-child { border-bottom:0; }.empty { color:var(--secondary-text-color); margin:0; padding:18px; }
        @media (max-width:820px) { .result-layout { grid-template-columns:1fr; }.result-layout .stat-grid { grid-template-columns:1fr 1fr; }.result-layout dl { grid-template-columns:1fr; } }
        @media (max-width:680px) { main { padding:18px 14px 30px; } header,.selection { display:block; } header .chip { display:inline-block; margin-top:14px; } .result-heading,.history-entry { align-items:flex-start; flex-direction:column; gap:10px; }.result-actions { align-items:flex-end; flex-direction:column; } .history-actions { width:100%; }.history-actions > span { flex:1; }.arrow { display:none; } label + .arrow + label { margin-top:14px; }.assessment-grid,.stat-grid,.timeline-details,.result-layout .stat-grid { grid-template-columns:1fr; }.timeline-details div:last-child,.timeline-relation { text-align:left; } .workspace,.result { padding:14px; } }
      </style>
      <main>
        <header>
          <div><h1>Statistiken zusammenführen</h1><p class="subtitle">Prüfe zwei Langzeitstatistiken und übernimm freigegebene Stundenwerte nach Bestätigung.</p></div>
          <span class="chip">Analyse</span>
        </header>
        <section class="workspace">
          <div class="workspace-title"><div><span class="eyebrow">Schritt 1</span><h2>Statistiken auswählen</h2></div></div>
          <div class="selection">
            <label>Quelle<span class="input-row"><input id="source" list="statistics" value="${escapeHtml(this._source)}" placeholder="sensor.alte_energie"><button class="picker-trigger" type="button" data-picker-role="source">Liste</button></span></label>
            <div class="arrow">→</div>
            <label>Ziel<span class="input-row"><input id="target" list="statistics" value="${escapeHtml(this._target)}" placeholder="sensor.neue_energie"><button class="picker-trigger" type="button" data-picker-role="target">Liste</button></span></label>
          </div>
          <datalist id="statistics">${options}</datalist>
          <div class="actions"><button id="analyze" ${this._loading ? "disabled" : ""}>${this._loading ? "Prüfung läuft…" : "Kompatibilität prüfen"}</button><span class="read-only">Die Prüfung verändert keine Daten.</span></div>
          ${this._error ? `<div class="error">${this._error}</div>` : ""}
        </section>
        ${this._historyTemplate()}
        ${this._resultTemplate()}
      </main>
      ${this._pickerTemplate()}`;
    this.shadowRoot.querySelector("#analyze").addEventListener("click", () => this._analyze());
    const copyResult = this.shadowRoot.querySelector("#copy-result");
    if (copyResult) copyResult.addEventListener("click", () => this._copyResult());
    const mergeButton = this.shadowRoot.querySelector("#merge");
    if (mergeButton) mergeButton.addEventListener("click", () => this._merge());
    const backupCheck = this.shadowRoot.querySelector("#backup-confirmed");
    const warningsCheck = this.shadowRoot.querySelector("#warnings-confirmed");
    const mergeCheck = this.shadowRoot.querySelector("#merge-confirmed");
    if (mergeButton && backupCheck && warningsCheck && mergeCheck) {
      const syncMergeButton = () => {
        mergeButton.disabled = this._mergeLoading || !backupCheck.checked || !warningsCheck.checked || !mergeCheck.checked;
      };
      backupCheck.addEventListener("change", syncMergeButton);
      warningsCheck.addEventListener("change", syncMergeButton);
      mergeCheck.addEventListener("change", syncMergeButton);
      syncMergeButton();
    }
    this.shadowRoot.querySelectorAll(".reuse-analysis").forEach((button) => {
      button.addEventListener("click", () => this._reuseAnalysis(this._analysisHistory[button.dataset.historyIndex]));
    });
    this.shadowRoot.querySelector("#source").addEventListener("input", (event) => {
      this._source = event.target.value;
    });
    this.shadowRoot.querySelector("#target").addEventListener("input", (event) => {
      this._target = event.target.value;
    });
    this.shadowRoot.querySelectorAll(".picker-trigger").forEach((trigger) => {
      trigger.addEventListener("click", () => this._openPicker(trigger.dataset.pickerRole));
    });
    const search = this.shadowRoot.querySelector("#statistic-search");
    if (search) {
      search.addEventListener("input", (event) => {
        this._pickerQuery = event.target.value;
        this._render();
        const nextSearch = this.shadowRoot.querySelector("#statistic-search");
        nextSearch.focus();
        nextSearch.setSelectionRange(this._pickerQuery.length, this._pickerQuery.length);
      });
    }
    this.shadowRoot.querySelectorAll(".picker-option").forEach((option) => {
      option.addEventListener("click", () => this._selectStatistic(option.dataset.statisticId));
    });
    const closePicker = this.shadowRoot.querySelector("#close-picker");
    if (closePicker) closePicker.addEventListener("click", () => this._closePicker());
    const backdrop = this.shadowRoot.querySelector("#picker-backdrop");
    if (backdrop) {
      backdrop.addEventListener("click", (event) => {
        if (event.target === backdrop) this._closePicker();
      });
    }
  }

  _openPicker(role) {
    this._pickerRole = role;
    this._pickerQuery = "";
    this._render();
    this.shadowRoot.querySelector("#statistic-search").focus();
  }

  _closePicker() {
    this._pickerRole = "";
    this._pickerQuery = "";
    this._render();
  }

  _selectStatistic(statisticId) {
    if (this._pickerRole === "source") this._source = statisticId;
    if (this._pickerRole === "target") this._target = statisticId;
    this._closePicker();
  }

  _pickerTemplate() {
    if (!this._pickerRole) return "";
    const title = this._pickerRole === "source" ? "Quellstatistik auswählen" : "Zielstatistik auswählen";
    const query = this._pickerQuery.toLocaleLowerCase();
    const matches = this._statistics
      .filter((statisticId) => statisticId.toLocaleLowerCase().includes(query))
      .slice(0, 100);
    const options = matches.map((statisticId) => `
      <button class="picker-option" type="button" data-statistic-id="${escapeHtml(statisticId)}">
        <span>${escapeHtml(statisticId)}</span><span>Auswählen</span>
      </button>`).join("");
    const detail = this._statistics.length === 0
      ? "Statistiken werden geladen oder stehen noch nicht zur Verfügung."
      : `${this._statistics.length} Statistiken verfügbar${matches.length === 100 ? " · erste 100 Treffer" : ""}`;
    return `
      <div class="picker-backdrop" id="picker-backdrop">
        <section class="picker" role="dialog" aria-modal="true" aria-label="${title}">
          <div class="picker-heading"><div><span class="eyebrow">Auswahl</span><h2>${title}</h2></div><button class="close-picker" id="close-picker" type="button" aria-label="Auswahl schließen">×</button></div>
          <input id="statistic-search" value="${escapeHtml(this._pickerQuery)}" placeholder="Statistik suchen …" autocomplete="off">
          <p class="picker-count">${detail}</p>
          <div class="picker-options">${options || '<p class="empty">Keine passende Statistik gefunden.</p>'}</div>
        </section>
      </div>`;
  }
}

customElements.define("statfusion-panel", StatFusionPanel);
