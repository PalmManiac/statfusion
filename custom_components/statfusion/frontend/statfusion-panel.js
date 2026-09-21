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
  unit_conversion_required: "Quelle und Ziel verwenden unterschiedliche, aber umrechenbare Einheiten. Eine spätere Übernahme müsste die Umrechnung gesondert prüfen.",
  unit_mismatch: "Quelle und Ziel verwenden nicht passende oder unbekannte Einheiten.",
  energy_flow_mismatch: "Quelle und Ziel scheinen entgegengesetzte Energieflüsse zu beschreiben. Prüfe ihre Bedeutung vor einer späteren Übernahme.",
  time_range_overlap: "Quelle und Ziel enthalten überlappende Zeiträume in der Langzeitstatistik.",
  time_range_gap: "Zwischen Quelle und Ziel besteht eine Zeitlücke. Prüfe die Lücke vor einer späteren Übernahme.",
  time_range_contiguous: "Die Quelle endet unmittelbar vor Beginn des Ziels.",
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
    this._loading = false;
    this._statisticsLoading = false;
    this._pickerRole = "";
    this._pickerQuery = "";
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

  _resultTemplate() {
    if (!this._result) return "";
    const blocked = this._result.decision === "blocked";
    const status = blocked ? "Nicht bereit" : "Bereit zur Prüfung";
    const findings = (this._result.findings || []).map((finding) => `
      <li class="finding ${finding.severity}">
        <span>${finding.severity === "error" ? "!" : finding.severity === "warning" ? "!" : "i"}</span>
        ${escapeHtml(FINDING_MESSAGES[finding.code] || finding.message)}
      </li>`).join("");
    return `
      <section class="result ${blocked ? "blocked" : "ready"}">
        <div class="result-heading">
          <div><span class="eyebrow">Prüfung</span><h2>${status}</h2></div>
          <span class="chip">${this._result.analysis_only ? "Keine Änderungen" : ""}</span>
        </div>
        <p>${blocked ? "Die ausgewählten Statistiken sind technisch nicht kompatibel. Es wurde kein Übernahmeplan erstellt und keine Recorder-Daten wurden verändert." : "Die ausgewählten Statistiken können als möglicher Kandidat für eine spätere Übernahme geprüft werden. Es wurden keine Recorder-Daten verändert."}</p>
        <div class="stat-grid">
          ${this._statisticCard("Quelle", this._result.source, "source")}
          ${this._statisticCard("Ziel", this._result.target, "target")}
        </div>
        <ul class="findings">${findings}</ul>
      </section>`;
  }

  _render() {
    if (!this.shadowRoot) return;
    const options = this._statistics.map((id) => `<option value="${escapeHtml(id)}"></option>`).join("");
    this.shadowRoot.innerHTML = `
      <style>
        :host { display:block; min-height:100%; color:var(--primary-text-color); background:var(--primary-background-color); font-family:var(--primary-font-family, sans-serif); }
        main { max-width:1160px; margin:0 auto; padding:32px 28px 48px; }
        header { display:flex; gap:20px; justify-content:space-between; align-items:flex-start; margin-bottom:26px; }
        h1,h2,p { margin:0; } h1 { font-size:30px; line-height:1.2; letter-spacing:-0.02em; } h2 { font-size:22px; line-height:1.25; }
        .subtitle { color:var(--secondary-text-color); font-size:16px; margin-top:7px; }
        .chip { background:var(--secondary-background-color); border-radius:18px; color:var(--secondary-text-color); font-size:13px; font-weight:600; padding:7px 12px; white-space:nowrap; }
        .workspace,.result { background:var(--card-background-color); border:1px solid var(--divider-color); border-radius:12px; box-shadow:var(--ha-card-box-shadow, none); padding:22px; }
        .workspace-title { display:flex; gap:12px; align-items:center; justify-content:space-between; margin-bottom:18px; } .eyebrow,.card-label { color:var(--secondary-text-color); font-size:12px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; }
        .selection { display:grid; grid-template-columns:1fr 42px 1fr; gap:12px; align-items:end; }
        label { color:var(--secondary-text-color); display:grid; font-size:14px; font-weight:600; gap:7px; } input { box-sizing:border-box; background:var(--input-fill-color, var(--secondary-background-color)); border:1px solid var(--input-idle-line-color, var(--divider-color)); border-radius:8px; color:var(--primary-text-color); font:inherit; padding:12px; width:100%; } input:focus { border-color:var(--primary-color); outline:2px solid color-mix(in srgb, var(--primary-color) 25%, transparent); }.input-row { display:flex; gap:8px; }.input-row input { min-width:0; }.picker-trigger { background:var(--secondary-background-color); border:1px solid var(--divider-color); border-radius:8px; color:var(--primary-text-color); cursor:pointer; font:inherit; font-weight:700; padding:0 12px; white-space:nowrap; }.picker-trigger:hover { border-color:#0878d1; color:#0878d1; }.arrow { color:var(--primary-color); font-size:25px; line-height:45px; text-align:center; }
        .actions { display:flex; align-items:center; gap:14px; margin-top:18px; } #analyze { appearance:none; background:#0878d1; border:0; border-radius:8px; box-shadow:0 1px 2px rgb(0 0 0 / 18%); color:#fff; cursor:pointer; font:inherit; font-weight:700; padding:11px 17px; } #analyze:hover { background:#0669b6; } #analyze:focus-visible { outline:3px solid color-mix(in srgb, #0878d1 35%, transparent); outline-offset:2px; } #analyze:disabled { background:#6c8cab; cursor:wait; opacity:1; } .read-only { color:var(--secondary-text-color); font-size:13px; }
        .error { background:var(--error-color); border-radius:8px; color:var(--text-primary-color, white); margin-top:16px; padding:11px 13px; } .result { border-top:3px solid var(--primary-color); margin-top:22px; } .result.blocked { border-top-color:var(--error-color); } .result-heading { align-items:center; display:flex; justify-content:space-between; } .result.ready .chip { color:var(--success-color, #2e7d32); } .result p { color:var(--secondary-text-color); margin-top:8px; }
        .stat-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:20px; }.stat-card { background:var(--secondary-background-color); border:1px solid var(--divider-color); border-radius:9px; border-top:3px solid var(--primary-color); padding:16px; }.stat-card.target { border-top-color:var(--accent-color, #00a7d8); }.stat-card strong { display:block; font-family:var(--code-font-family, monospace); font-size:15px; margin-top:6px; overflow-wrap:anywhere; } dl { display:grid; gap:9px; margin:16px 0 0; } dl div { display:flex; gap:12px; justify-content:space-between; } dt { color:var(--secondary-text-color); } dd { margin:0; text-align:right; }
        .findings { display:grid; gap:8px; list-style:none; margin:20px 0 0; padding:0; }.finding { align-items:flex-start; background:var(--secondary-background-color); border-radius:8px; display:flex; gap:10px; padding:11px; }.finding span { align-items:center; background:var(--primary-color); border-radius:50%; color:white; display:inline-flex; flex:0 0 19px; font-size:12px; font-weight:700; height:19px; justify-content:center; }.finding.error span { background:var(--error-color); }.finding.warning span { background:var(--warning-color, #f6a700); }
        .picker-backdrop { align-items:center; background:rgb(0 0 0 / 35%); display:flex; inset:0; justify-content:center; padding:20px; position:fixed; z-index:10; }.picker { background:var(--card-background-color); border:1px solid var(--divider-color); border-radius:12px; box-shadow:0 16px 40px rgb(0 0 0 / 28%); max-width:660px; padding:22px; width:100%; }.picker-heading { align-items:flex-start; display:flex; justify-content:space-between; margin-bottom:17px; }.close-picker { background:transparent; border:0; color:var(--secondary-text-color); cursor:pointer; font-size:28px; line-height:28px; padding:0 5px; }.picker-count { color:var(--secondary-text-color); font-size:13px; margin:11px 0; }.picker-options { border:1px solid var(--divider-color); border-radius:8px; max-height:420px; overflow:auto; }.picker-option { background:transparent; border:0; border-bottom:1px solid var(--divider-color); color:var(--primary-text-color); cursor:pointer; display:flex; font-family:var(--code-font-family, monospace); font-size:14px; font-weight:400; justify-content:space-between; padding:13px; text-align:left; width:100%; }.picker-option:hover { background:var(--secondary-background-color); }.picker-option span:last-child { color:#0878d1; font-family:var(--primary-font-family, sans-serif); font-size:12px; font-weight:700; }.picker-option:last-child { border-bottom:0; }.empty { color:var(--secondary-text-color); margin:0; padding:18px; }
        @media (max-width:680px) { main { padding:22px 16px 32px; } header,.selection { display:block; } header .chip { display:inline-block; margin-top:14px; } .arrow { display:none; } label + .arrow + label { margin-top:14px; }.stat-grid { grid-template-columns:1fr; } .workspace,.result { padding:17px; } }
      </style>
      <main>
        <header>
          <div><h1>Statistiken zusammenführen</h1><p class="subtitle">Prüfe zwei Langzeitstatistiken, bevor später Daten übernommen werden.</p></div>
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
        ${this._resultTemplate()}
      </main>
      ${this._pickerTemplate()}`;
    this.shadowRoot.querySelector("#analyze").addEventListener("click", () => this._analyze());
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
