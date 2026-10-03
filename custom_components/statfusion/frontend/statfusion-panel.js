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
  unit_class_mismatch: "Quelle und Ziel verwenden unterschiedliche oder unbekannte Geräteklassen.",
  transfer_timestamp_collision: "Mindestens eine Quellstunde ist bereits im Ziel vorhanden.",
};

const REVIEW_PLAN_STEPS = {
  energy_flow_mismatch: "Den Energiefluss von Quelle und Ziel fachlich bestätigen.",
  time_range_gap: "Die angezeigte Zeitlücke fachlich prüfen und dokumentieren.",
  unit_conversion_required: "Die erforderliche Einheitenumrechnung fachlich und technisch prüfen.",
  sum_baseline_discontinuity: "Mögliche sichtbare Sprünge durch unterschiedliche Ausgangswerte berücksichtigen.",
};

const EN_TRANSLATIONS = {
  "Quelle und Ziel müssen unterschiedliche Statistiken sein.": "Source and target must be different statistics.",
  "Die Quellstatistik enthält keine stündlichen Langzeitstatistiken.": "The source has no hourly long-term statistics.",
  "Die Zielstatistik enthält keine stündlichen Langzeitstatistiken.": "The target has no hourly long-term statistics.",
  "Die Quellstatistik enthält weder Summen- noch Mittelwertdaten.": "The source contains neither sum nor mean data.",
  "Die Zielstatistik enthält weder Summen- noch Mittelwertdaten.": "The target contains neither sum nor mean data.",
  "Quelle und Ziel verwenden unterschiedliche Mittelwertverfahren.": "Source and target use different mean calculation methods.",
  "Quelle und Ziel verwenden nicht passende oder unbekannte Einheiten.": "Source and target use incompatible or unknown units.",
  "Die Quelle endet unmittelbar vor Beginn des Ziels.": "The source ends immediately before the target starts.",
  "Quelle und Ziel verwenden unterschiedliche Datenformen und können nicht sicher zusammengeführt werden.": "Source and target use different data types and cannot be merged safely.",
  "Quelle und Ziel verwenden unterschiedliche Einheiten. Die Übernahme ist blockiert, damit keine Umrechnung oder Wertänderung erfolgt.": "Source and target use different units. The merge is blocked to prevent conversions or value changes.",
  "Kumulative Werte werden unverändert kopiert. Unterschiedliche Ausgangswerte können als sichtbarer Sprung erscheinen; Werte werden weder angepasst noch addiert.": "Cumulative values are copied unchanged. Different starting values may create a visible jump; values are neither adjusted nor added together.",
  "Quelle und Ziel scheinen entgegengesetzte Energieflüsse zu beschreiben. Prüfe ihre Bedeutung vor einer späteren Übernahme.": "Source and target appear to describe opposite energy flows. Review their meaning before merging.",
  "Das Ziel beginnt zeitlich vor der Quelle. Wähle die ältere Statistik als Quelle und die neuere als Ziel.": "The target starts before the source. Choose the older statistic as the source and the newer one as the target.",
  "Quelle und Ziel enthalten überlappende Zeiträume in der Langzeitstatistik.": "The source and target long-term statistics have overlapping time ranges.",
  "Zwischen Quelle und Ziel besteht eine Zeitlücke. Prüfe die Lücke vor einer späteren Übernahme.": "There is a time gap between the source and target. Review the gap before merging.",
  "Den Energiefluss von Quelle und Ziel fachlich bestätigen.": "Confirm that the source and target describe the intended energy flow.",
  "Die angezeigte Zeitlücke fachlich prüfen und dokumentieren.": "Review and document the displayed time gap.",
  "Die erforderliche Einheitenumrechnung fachlich und technisch prüfen.": "Review the required unit conversion.",
  "Mögliche sichtbare Sprünge durch unterschiedliche Ausgangswerte berücksichtigen.": "Account for possible visible jumps caused by different starting values.",
  "Die verfügbaren Statistiken konnten nicht geladen werden.": "Available statistics could not be loaded.",
  "Bitte wähle eine Quell- und eine Zielstatistik aus.": "Choose a source and a target statistic.",
  "Die Analyse konnte nicht ausgeführt werden. Bitte prüfe die Auswahl.": "The analysis could not be run. Check your selection.",
  "Die Übernahme wurde blockiert oder konnte nicht bestätigt werden. Prüfe die Hinweise und Recorder-Protokolle, bevor du es erneut versuchst.": "The merge was blocked or could not be verified. Review the findings and Recorder logs before trying again.",
  "Letzte Prüfungen": "Recent checks",
  "Zur Übernahme bereit": "Ready for review",
  "Bereit zur Prüfung": "Ready for review",
  "Die Analyse verändert keine Daten.": "The analysis does not change any data.",
  "Keine Hinweise": "No findings",
  "Status:": "Status:",
  "Quelle:": "Source:",
  "Ziel:": "Target:",
  "Quelle Zeitraum:": "Source time range:",
  "Ziel Zeitraum:": "Target time range:",
  "Hinweise:": "Findings:",
  "Analyse kopiert": "Analysis copied",
  "Kopieren nicht möglich": "Could not copy",
  "Nicht bereit": "Not ready",
  "Überlappung": "Overlap",
  "Zeitlücke": "Time gap",
  "Direkter Übergang": "Direct transition",
  "Falsche Reihenfolge": "Wrong order",
  "Das Ziel beginnt vor der Quelle. Wähle die ältere Statistik als Quelle.": "The target starts before the source. Choose the older statistic as the source.",
  "Quelle und Ziel schließen zeitlich direkt aneinander an.": "The source and target are directly adjacent in time.",
  "Quelle und Ziel überlappen sich um": "The source and target overlap by",
  "Zwischen Quelle und Ziel liegt eine Zeitlücke von": "There is a time gap of",
  "StatFusion – Analyse": "StatFusion – Analysis",
  "Die Prüfung verändert keine Daten.": "Checking does not change any data.",
  "Quelle endet": "Source ends",
  "Ziel beginnt": "Target begins",
  "Zeitlicher Übergang": "Timeline",
  "Auf einen Blick": "At a glance",
  "Prüfstatus": "Check results",
  "Technik": "Technical",
  "Blockiert": "Blocked",
  "Mindestens eine technische Voraussetzung fehlt.": "At least one technical requirement is not met.",
  "Geprüft": "Passed",
  "Keine blockierende technische Abweichung erkannt.": "No blocking technical issue found.",
  "Energiefluss": "Energy flow",
  "Prüfen": "Review",
  "Quelle und Ziel könnten unterschiedliche Flüsse beschreiben.": "Source and target may describe different flows.",
  "Kein Hinweis": "No issue found",
  "Die Statistik-IDs liefern keinen gegenteiligen Flusshinweis.": "The statistic IDs do not indicate opposing flows.",
  "Zeitraum": "Time range",
  "Nicht verfügbar": "Unavailable",
  "Für mindestens eine Statistik fehlen Zeitbereichsdaten.": "Time-range data is missing for at least one statistic.",
  "Das Ziel muss nach der Quelle beginnen.": "The target must start after the source.",
  "Die Zeiträume können nicht direkt aneinander anschließen.": "The time ranges cannot be joined directly.",
  "Lücke": "Gap",
  "Die Lücke muss vor einer späteren Übernahme geprüft werden.": "Review the gap before merging.",
  "Quelle und Ziel schließen zeitlich direkt aneinander an.": "The source and target are directly adjacent in time.",
  "Keine Änderungen": "No changes yet",
  "Die ausgewählten Statistiken sind technisch nicht kompatibel. Es wurde kein Übernahmeplan erstellt und keine Recorder-Daten wurden verändert.": "The selected statistics are not technically compatible. No merge plan was created and no Recorder data was changed.",
  "Die ausgewählten Statistiken können als möglicher Kandidat für eine spätere Übernahme geprüft werden. Es wurden keine Recorder-Daten verändert.": "The selected statistics passed the technical checks. No Recorder data has been changed yet.",
  "Den angezeigten Hinweis vor einer späteren Übernahme prüfen.": "Review the displayed finding before merging.",
  "Die fachliche Zuordnung von Quelle und Ziel bestätigen.": "Confirm that the source and target are assigned correctly.",
  "Vorschau": "Preview",
  "Übernahmeplan zur Prüfung": "Merge plan",
  "Hinweise prüfen": "Review findings",
  "Vorbereitung": "Preparation",
  "Die Übernahme kopiert die Quellstunden unverändert ins Ziel. Quellwerte und bestehende Zielstunden bleiben erhalten.": "The merge copies source hours unchanged into the target. Source data and existing target hours are preserved.",
  "Übernahme abgeschlossen": "Merge completed",
  "Letzter Schritt": "Final step",
  "Stundenwerte übernehmen": "Merge hourly values",
  "StatFusion ergänzt ausschließlich fehlende Stunden im Ziel. Die Quelle und bereits vorhandene Zielstunden bleiben unverändert. Werte werden nicht addiert oder umgerechnet.": "StatFusion only adds missing hours to the target. The source and existing target hours remain unchanged. Values are not added together or converted.",
  "Ich habe vor der Übernahme eine vollständige Home-Assistant-Sicherung erstellt.": "I have created a full Home Assistant backup before merging.",
  "Ich habe alle Warnhinweise geprüft, insbesondere mögliche Sprünge bei kumulativen Werten.": "I have reviewed all warnings, especially possible jumps in cumulative values.",
  "Ich bestätige die Zuordnung und möchte die angezeigten Quellstunden ins Ziel kopieren.": "I confirm the selection and want to copy the displayed source hours into the target.",
  "Recorder übernimmt …": "Recorder is processing …",
  "Prüfung läuft…": "Checking…",
  "Kompatibilität prüfen": "Check compatibility",
  "Statistiken zusammenführen": "Merge statistics",
  "Prüfe zwei Langzeitstatistiken und übernimm freigegebene Stundenwerte nach Bestätigung.": "Check two long-term statistics, then merge approved hourly values after confirmation.",
  "Langzeitstatistiken sicher prüfen, zusammenführen oder zwischen Installationen übertragen.": "Review and merge long-term statistics or transfer them between installations.",
  "Analyse und Übertragung": "Analysis and transfer",
  "Langzeitstatistiken verwalten": "Manage long-term statistics",
  "Arbeitsbereich 1": "Workspace 1",
  "In dieser Installation zusammenführen": "Merge on this installation",
  "Recorder-Statistiken": "Recorder statistics",
  "Arbeitsbereich 2": "Workspace 2",
  "JSON-Datei": "JSON file",
  "Datei auswählen, Ziel prüfen und alle Import-Schritte gemeinsam in einem Dialog durchgehen.": "Choose a file, review the target, and complete the import steps together in one dialog.",
  "Analyse": "Analysis",
  "Schritt 1": "Step 1",
  "Statistiken auswählen": "Select statistics",
  "Quelle": "Source",
  "Ziel": "Target",
  "Liste": "Browse",
  "Summe": "Sum",
  "Mittelwert": "Mean",
  "Unbekannt": "Unknown",
  "Datenform": "Data type",
  "Einheit": "Unit",
  "Stundenwerte": "Hourly values",
  "Die Prüfung verändert keine Daten.": "Checking does not change any data.",
  "Quellstatistik auswählen": "Select source statistic",
  "Zielstatistik auswählen": "Select target statistic",
  "Statistiken werden geladen oder stehen noch nicht zur Verfügung.": "Statistics are loading or are not available yet.",
  "Statistiken verfügbar": "statistics available",
  "erste 100 Treffer": "first 100 matches",
  "Auswahl": "Selection",
  "Auswahl schließen": "Close selection",
  "Statistik suchen …": "Search statistics…",
  "Keine passende Statistik gefunden.": "No matching statistic found.",
  "Auswahl übernehmen": "Reuse selection",
  "Möchtest du die ausgewählten Stundenwerte jetzt übernehmen?": "Do you want to merge the selected hourly values now?",
  "Erstelle vor jeder Übernahme ein vollständiges Home-Assistant-Backup und prüfe, dass es verfügbar ist.": "Create a full Home Assistant backup before every merge and verify that it is available.",
  "StatFusion verändert historische Recorder-Daten dauerhaft. Die Nutzung erfolgt auf eigene Gefahr. Für Datenverlust oder Folgeschäden übernimmt das Projektteam – soweit gesetzlich zulässig – keine Haftung.": "StatFusion permanently changes historical Recorder data. Use it at your own risk. To the extent permitted by law, the project team accepts no liability for data loss or consequential damages.",
  "Warnung": "Warning",
  "Übernommene Stunden:": "Hours merged:",
  "Die Quellstatistik und vorhandenen Zielstunden bleiben erhalten.": "The source statistic and existing target hours are preserved.",
  "Auswählen": "Select",
  " in dieser Ansicht": " in this view",
  " Stunden": " hours",
  " Stunde": " hour",
  " Tage": " days",
  " Tag": " day",
  "Warnung": "Warning",
  "Erstelle vor jeder Übernahme ein vollständiges Home-Assistant-Backup und prüfe, dass es verfügbar ist.": "Create a full Home Assistant backup before every merge and make sure it is available.",
  "StatFusion verändert historische Recorder-Daten dauerhaft. Die Nutzung erfolgt auf eigene Gefahr. Für Datenverlust oder Folgeschäden übernimmt das Projektteam – soweit gesetzlich zulässig – keine Haftung.": "StatFusion permanently changes historical Recorder data. Use it at your own risk. To the extent permitted by law, the project team accepts no liability for data loss or consequential damages.",
  "Übernommene Stunden:": "Hours merged:",
  "Die Quellstatistik und vorhandenen Zielstunden bleiben erhalten.": "The source statistic and existing target hours are preserved.",
  "Die blockierenden Hinweise müssen zuerst geklärt werden. Es wurden keine Daten verändert.": "Resolve the blocking findings first. No data was changed.",
  "Kein Übernahmeplan verfügbar": "No merge plan available",
  "Sitzung": "Session",
  "Analyse kopieren": "Copy analysis",
  "Quelle Zeitraum:": "Source time range:",
  "Ziel Zeitraum:": "Target time range:",
  "Hinweise:": "Findings:",
  "Warnungen": "Warnings",
  "Ergebnis": "Result",
  "Kompatibilität": "Compatibility",
  "Stündliche Werte": "Hourly values",
  "Importvorschau": "Import preview",
  "Exportierte Quelle": "Exported source",
  "Zielstatistik": "Target statistic",
  "Stunden": "Hours",
  "Überschneidende Stunden": "Overlapping hours",
  "Statistiken aus anderer Installation importieren": "Import statistics from another installation",
  "Prüfe eine StatFusion-Exportdatei gegen die ausgewählte Zielstatistik. Diese Vorschau verändert keine Daten.": "Check a StatFusion export against the selected target statistic. This preview does not change any data.",
  "JSON-Datei auswählen": "Choose JSON file",
  "Keine Datei ausgewählt": "No file selected",
  "Importvorschau erstellen": "Create import preview",
  "Vorschau wird geprüft…": "Checking preview…",
  "Bitte zuerst eine Zielstatistik auswählen.": "Select a target statistic first.",
  "Bitte eine StatFusion-Exportdatei auswählen.": "Choose a StatFusion export file.",
  "Die Vorschau konnte nicht erstellt werden. Prüfe Datei und Zielstatistik.": "Could not create the preview. Check the file and target statistic.",
  "Die Datei und Zielstatistik wurden geprüft. Es wurden keine Daten verändert.": "The file and target statistic were checked. No data was changed.",
  "Keine Hinweise": "No findings",
  "Quelle exportieren": "Export source",
  "Export läuft…": "Exporting…",
  "Die Exportdatei wurde heruntergeladen.": "The export file was downloaded.",
  "Für den Export bitte eine Quellstatistik auswählen.": "Select a source statistic to export.",
  "Der Export ist fehlgeschlagen. Prüfe die Statistik und das Home-Assistant-Protokoll.": "Export failed. Check the statistic and the Home Assistant logs.",
  "Quelle und Ziel verwenden unterschiedliche oder unbekannte Geräteklassen.": "Source and target use different or unknown device classes.",
  "Mindestens eine Quellstunde ist bereits im Ziel vorhanden.": "At least one source hour already exists in the target.",
  "Prüfe die Hinweise vor jedem späteren Import.": "Review the findings before any later import.",
  "Backup erstellt": "Backup created",
  "Hinweise geprüft": "Warnings reviewed",
  "Import bestätigen": "Confirm import",
  "Ich habe vor dem Import ein vollständiges Home-Assistant-Backup erstellt und geprüft, dass es verfügbar ist.": "I created a full Home Assistant backup before importing and verified that it is available.",
  "Erstelle ein vollständiges Home-Assistant-Backup und prüfe, dass es verfügbar ist. StatFusion verändert historische Recorder-Daten dauerhaft; die Nutzung erfolgt auf eigene Gefahr. Für Datenverlust oder Folgeschäden übernimmt das Projektteam – soweit gesetzlich zulässig – keine Haftung.": "Create a full Home Assistant backup and verify that it is available. StatFusion permanently changes historical Recorder data; use it at your own risk. To the extent permitted by law, the project team accepts no liability for data loss or consequential damages.",
  "Ich habe alle Hinweise geprüft und bestätige die Zuordnung von Datei und Zielstatistik.": "I reviewed all findings and confirm the file-to-target mapping.",
  "Ich bestätige den Import der angezeigten Stunden in die Zielstatistik.": "I confirm importing the displayed hours into the target statistic.",
  "Stundenwerte jetzt importieren": "Import hourly values now",
  "Recorder importiert …": "Recorder is importing …",
  "Import abgeschlossen": "Import completed",
  "Die Quell-Datei und vorhandenen Zielstunden blieben unverändert. Alle importierten Stunden wurden überprüft.": "The source file and existing target hours were preserved. All imported hours were verified.",
  "Import fehlgeschlagen": "Import failed",
  "Backup erforderlich": "Backup required",
  "Importierte Stunden:": "Imported hours:",
  "Der Import konnte nicht bestätigt werden. Prüfe Recorder-Protokolle und Zielstatistik, bevor du es erneut versuchst.": "The import could not be verified. Check Recorder logs and the target statistic before trying again.",
  "Geführte Übertragung": "Guided transfer",
  "Statistik importieren": "Import statistics",
  "Übertragung zwischen Installationen": "Transfer between installations",
  "Exportiere auf dem alten System eine Statistik oder importiere eine Exportdatei auf diesem System.": "Export a statistic on the old system or import an export file on this system.",
  "Quellstatistik für den Export": "Source statistic to export",
  "Export starten": "Start export",
  "Übertragung öffnen": "Open transfer",
  "Datei und Ziel auswählen": "Choose file and target",
  "Die Exportdatei wird nur auf dieser Home-Assistant-Installation geprüft.": "The export file is checked only on this Home Assistant installation.",
  "StatFusion-JSON-Datei": "StatFusion JSON file",
  "Vorhandene Zielstatistik": "Existing target statistic",
  "Noch kein Ziel ausgewählt": "No target selected yet",
  "Vorschau erstellen": "Create preview",
  "Vorschau und Hinweise prüfen": "Review preview and findings",
  "Hier siehst du den Umfang und das Ergebnis der Prüfung, bevor du etwas importierst.": "Review the scope and check results before importing anything.",
  "Schließen ändert keine Recorder-Daten.": "Closing does not change Recorder data.",
  "Schließen": "Close",
};

class StatFusionPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._statistics = [];
    this._source = "";
    this._target = "";
    this._exportStatistic = "";
    this._transferTarget = "";
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
    this._exportLoading = false;
    this._exportStatus = "";
    this._exportError = "";
    this._transferFile = null;
    this._transferLoading = false;
    this._transferPreview = null;
    this._transferError = "";
    this._transferImportLoading = false;
    this._transferImportResult = null;
    this._transferDialogOpen = false;
  }

  set hass(value) {
    const previousLanguage = this._isEnglish();
    this._hass = value;
    if (!this._statistics.length && !this._statisticsLoading) {
      this._loadStatistics();
    }
    if (!this.shadowRoot.innerHTML || previousLanguage !== this._isEnglish()) this._render();
  }

  get hass() {
    return this._hass;
  }

  _isEnglish() {
    const language = this._hass?.locale?.language || navigator.language || "de";
    return language.toLowerCase().startsWith("en");
  }

  _accessToken() {
    return this._hass?.connection?.options?.auth?.accessToken
      || this._hass?.auth?.accessToken
      || null;
  }

  _apiUrl(path) {
    const base = this._hass?.hassUrl ? this._hass.hassUrl(path) : path;
    return new URL(base, window.location.href);
  }

  _localize(value) {
    if (!this._isEnglish()) return value;
    return Object.entries(EN_TRANSLATIONS).reduce(
      (translated, [german, english]) => translated.replaceAll(german, english),
      value,
    );
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
    if (!window.confirm(this._localize("Möchtest du die ausgewählten Stundenwerte jetzt übernehmen?"))) return;

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

  async _exportStatistics() {
    const source = this.shadowRoot.querySelector("#export-source-id").value.trim();
    this._exportStatistic = source;
    this._exportStatus = "";
    this._exportError = "";
    if (!source) {
      this._exportError = "Für den Export bitte eine Quellstatistik auswählen.";
      this._render();
      return;
    }

    const accessToken = this._accessToken();
    if (!accessToken) {
      this._exportError = "Der Export ist fehlgeschlagen. Prüfe die Statistik und das Home-Assistant-Protokoll.";
      this._render();
      return;
    }

    this._source = source;
    this._exportLoading = true;
    this._render();
    try {
      const url = this._apiUrl("/api/statfusion/export");
      url.searchParams.set("statistic_id", source);
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) throw new Error("Export request failed");

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const filename = source.replace(/[^a-zA-Z0-9._-]/g, "_");
      link.href = objectUrl;
      link.download = `statfusion-${filename}.json`;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      this._exportStatus = "Die Exportdatei wurde heruntergeladen.";
    } catch (error) {
      this._exportError = "Der Export ist fehlgeschlagen. Prüfe die Statistik und das Home-Assistant-Protokoll.";
    } finally {
      this._exportLoading = false;
      this._render();
    }
  }

  async _previewTransfer() {
    const target = this._transferTarget.trim();
    this._transferError = "";
    this._transferPreview = null;
    this._transferImportResult = null;
    if (!this._transferFile) {
      this._transferError = "Bitte eine StatFusion-Exportdatei auswählen.";
      this._render();
      return;
    }
    if (!target) {
      this._transferError = "Bitte zuerst eine Zielstatistik auswählen.";
      this._render();
      return;
    }

    const accessToken = this._accessToken();
    if (!accessToken) {
      this._transferError = "Die Vorschau konnte nicht erstellt werden. Prüfe Datei und Zielstatistik.";
      this._render();
      return;
    }

    this._transferLoading = true;
    this._render();
    try {
      const url = this._apiUrl("/api/statfusion/import/preview");
      url.searchParams.set("target_statistic_id", target);
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: this._transferFile,
      });
      if (!response.ok) throw new Error("Preview request failed");
      this._transferPreview = await response.json();
    } catch (error) {
      this._transferError = "Die Vorschau konnte nicht erstellt werden. Prüfe Datei und Zielstatistik.";
    } finally {
      this._transferLoading = false;
      this._render();
    }
  }

  async _importTransfer() {
    const backup = this.shadowRoot.querySelector("#transfer-backup-confirmed")?.checked;
    const warnings = this.shadowRoot.querySelector("#transfer-warnings-confirmed")?.checked;
    const confirm = this.shadowRoot.querySelector("#transfer-import-confirmed")?.checked;
    if (!backup || !warnings || !confirm || this._transferPreview?.decision !== "ready_for_review") return;

    const target = this._transferTarget.trim();
    const accessToken = this._accessToken();
    if (!this._transferFile || !target || !accessToken) {
      this._transferError = "Der Import konnte nicht bestätigt werden. Prüfe Recorder-Protokolle und Zielstatistik, bevor du es erneut versuchst.";
      this._render();
      return;
    }

    this._transferImportLoading = true;
    this._transferError = "";
    this._render();
    try {
      const url = this._apiUrl("/api/statfusion/import");
      url.searchParams.set("target_statistic_id", target);
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "X-StatFusion-Backup-Confirmed": "true",
          "X-StatFusion-Warnings-Confirmed": "true",
          "X-StatFusion-Import-Confirmed": "true",
        },
        body: this._transferFile,
      });
      if (!response.ok) throw new Error("Import was not confirmed");
      this._transferImportResult = await response.json();
    } catch (error) {
      this._transferError = "Der Import konnte nicht bestätigt werden. Prüfe Recorder-Protokolle und Zielstatistik, bevor du es erneut versuchst.";
    } finally {
      this._transferImportLoading = false;
      this._render();
    }
  }

  _transferPreviewTemplate() {
    if (!this._transferPreview) return "";
    const preview = this._transferPreview;
    const ready = preview.decision === "ready_for_review";
    const findings = (preview.findings || []).map((finding) => `
      <li class="finding ${finding.severity}">
        <span>${finding.severity === "error" ? "!" : finding.severity === "warning" ? "!" : "i"}</span>
        ${escapeHtml(FINDING_MESSAGES[finding.code] || finding.message)}
      </li>`).join("");
    return `
      <section class="transfer-preview ${ready ? "ready" : "blocked"}" aria-live="polite">
        <div class="result-heading">
          <div><span class="eyebrow">Importvorschau</span><h2>${ready ? "Bereit zur Prüfung" : "Blockiert"}</h2></div>
          <span class="chip">${ready ? "Keine Änderungen" : "Blockiert"}</span>
        </div>
        <p>${"Die Datei und Zielstatistik wurden geprüft. Es wurden keine Daten verändert."}</p>
        <div class="transfer-preview-grid">
          <div><span>Exportierte Quelle</span><strong>${escapeHtml(preview.source.statistic_id)}</strong></div>
          <div><span>Zielstatistik</span><strong>${escapeHtml(preview.target.statistic_id)}</strong></div>
          <div><span>Zeitraum</span><strong>${escapeHtml(this._formatDate(preview.source.first))} – ${escapeHtml(this._formatDate(preview.source.last))}</strong></div>
          <div><span>Stunden</span><strong>${Number(preview.source.sample_count) || 0}</strong></div>
          <div><span>Einheit</span><strong>${escapeHtml(preview.source.unit_of_measurement || "Unbekannt")}</strong></div>
          <div><span>Überschneidende Stunden</span><strong>${Number(preview.colliding_hours) || 0}</strong></div>
        </div>
        ${findings ? `<ul class="findings">${findings}</ul>` : `<p>Keine Hinweise.</p>`}
        <p class="read-only">Die Vorschau verändert keine Recorder-Daten.</p>
        ${ready ? this._transferConfirmationTemplate() : ""}
      </section>`;
  }

  _transferConfirmationTemplate() {
    if (this._transferImportResult) {
      return `<section class="transfer-import-result" role="status"><strong>Import abgeschlossen</strong><p>Die Quell-Datei und vorhandenen Zielstunden blieben unverändert. Alle importierten Stunden wurden überprüft.</p><p>Importierte Stunden: ${Number(this._transferImportResult.imported_hours) || 0}</p></section>`;
    }
    const disabled = this._transferImportLoading ? "disabled" : "";
    return `
      <aside class="transfer-backup-notice" role="alert"><strong>Backup erforderlich</strong><p>Erstelle vor dem Import ein vollständiges Home-Assistant-Backup und prüfe, dass es verfügbar ist. Der Import erfolgt auf eigene Gefahr.</p></aside>
      <label class="confirm-check"><input id="transfer-backup-confirmed" type="checkbox"><span>Ich habe vor dem Import ein vollständiges Home-Assistant-Backup erstellt und geprüft, dass es verfügbar ist.</span></label>
      <label class="confirm-check"><input id="transfer-warnings-confirmed" type="checkbox"><span>Ich habe alle Hinweise geprüft und bestätige die Zuordnung von Datei und Zielstatistik.</span></label>
      <label class="confirm-check"><input id="transfer-import-confirmed" type="checkbox"><span>Ich bestätige den Import der angezeigten Stunden in die Zielstatistik.</span></label>
      <button class="transfer-button" id="import-transfer" type="button" ${disabled}>${this._transferImportLoading ? "Recorder importiert …" : "Stundenwerte jetzt importieren"}</button>`;
  }

  _transferDialogTemplate() {
    const closeDisabled = this._transferImportLoading ? "disabled" : "";
    return `
      <dialog class="workflow-dialog" id="transfer-dialog" aria-labelledby="transfer-dialog-title">
        <header class="dialog-header">
          <div><span class="eyebrow">Geführte Übertragung</span><h2 id="transfer-dialog-title">Statistik importieren</h2></div>
          <button class="close-dialog" id="close-transfer-dialog" type="button" aria-label="Dialog schließen" ${closeDisabled}>×</button>
        </header>
        <div class="dialog-content">
          <section class="dialog-step">
            <div class="step-title"><span>1</span><div><strong>Datei und Ziel auswählen</strong><p>Die Exportdatei wird nur auf dieser Home-Assistant-Installation geprüft.</p></div></div>
            <div class="transfer-controls">
              <label>StatFusion-JSON-Datei<input id="transfer-file" type="file" accept=".json,application/json"></label>
              <div class="transfer-target"><span class="field-label">Vorhandene Zielstatistik</span><div class="input-row"><output id="transfer-target-value">${escapeHtml(this._transferTarget || "Noch kein Ziel ausgewählt")}</output><button class="picker-trigger" type="button" data-picker-role="transfer-target">Liste</button></div></div>
            </div>
            <p class="file-selection" aria-live="polite">${escapeHtml(this._transferFile?.name || "Keine Datei ausgewählt")}</p>
            <button class="transfer-button" id="preview-transfer" type="button" ${this._transferLoading ? "disabled" : ""}>${this._transferLoading ? "Vorschau wird geprüft…" : "Vorschau erstellen"}</button>
            ${this._transferError ? `<p class="transfer-error" role="alert">${escapeHtml(this._transferError)}</p>` : ""}
          </section>
          ${this._transferPreview ? `<section class="dialog-step"><div class="step-title"><span>2</span><div><strong>Vorschau und Hinweise prüfen</strong><p>Hier siehst du den Umfang und das Ergebnis der Prüfung, bevor du etwas importierst.</p></div></div>${this._transferPreviewTemplate()}</section>` : ""}
        </div>
        <footer class="dialog-footer"><span class="read-only">Schließen ändert keine Recorder-Daten.</span><button class="secondary-button" id="cancel-transfer-dialog" type="button" ${closeDisabled}>Schließen</button></footer>
      </dialog>`;
  }

  _openTransferDialog() {
    this._transferDialogOpen = true;
    this._render();
    this.shadowRoot.querySelector("#transfer-file")?.focus();
  }

  _closeTransferDialog() {
    if (this._transferImportLoading) return;
    this._transferDialogOpen = false;
    this._render();
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
            <div class="history-actions"><span>${entry.decision === "blocked" ? "Blockiert" : "Bereit zur Prüfung"}</span><button type="button" class="reuse-analysis" data-history-index="${index}">Auswahl übernehmen</button></div>
          </article>`).join("")}</div>
      </details>`;
  }

  async _copyResult() {
    if (!this._result || !navigator.clipboard) return;

    const status = this._result.decision === "blocked" ? "Nicht bereit" : "Bereit zur Prüfung";
    const findings = (this._result.findings || [])
      .map((finding) => `- ${FINDING_MESSAGES[finding.code] || finding.message}`);
    const text = this._localize([
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
    ].join("\n"));

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
        return `<section class="merge-result success"><strong>Übernahme abgeschlossen</strong><p>Die Quellstatistik und vorhandenen Zielstunden bleiben erhalten.</p><p>Übernommene Stunden: ${Number(this._mergeResult.imported_hours) || 0}</p></section>`;
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
    const markup = `
      <style>
        :host { display:block; min-height:100%; color:var(--primary-text-color); background:var(--primary-background-color); font-family:var(--primary-font-family, sans-serif); }
        main { max-width:1240px; margin:0 auto; padding:22px 24px 36px; }
        .workflow-grid { display:grid; gap:16px; grid-template-columns:minmax(0,1fr) minmax(0,1fr); }
        header { display:flex; gap:16px; justify-content:space-between; align-items:flex-start; margin-bottom:18px; }
        h1,h2,p { margin:0; } h1 { font-size:27px; line-height:1.2; letter-spacing:-0.02em; } h2 { font-size:20px; line-height:1.25; }
        .subtitle { color:var(--secondary-text-color); font-size:15px; margin-top:5px; }
        .chip { background:var(--secondary-background-color); border-radius:18px; color:var(--secondary-text-color); font-size:13px; font-weight:600; padding:7px 12px; white-space:nowrap; }
        .workspace,.result { background:var(--card-background-color); border:1px solid var(--divider-color); border-radius:12px; box-shadow:var(--ha-card-box-shadow, 0 2px 8px rgb(0 0 0 / 12%)); padding:19px; }
        .merge-workspace { border-top:3px solid var(--primary-color); }.transfer-workspace { border-top:3px solid var(--accent-color, #00a7d8); }.workspace-description { color:var(--secondary-text-color); font-size:14px; line-height:1.45; margin-top:-4px; }.field-label { color:var(--secondary-text-color); display:block; font-size:14px; font-weight:600; margin-bottom:7px; }.export-controls { align-items:end; display:grid; gap:10px; grid-template-columns:minmax(0,1fr) auto; margin-top:15px; }.export-controls label { min-width:0; }.export-selection { display:flex; gap:8px; }.export-selection input { min-width:0; }.transfer-launch { align-items:center; background:var(--secondary-background-color); border:1px solid var(--divider-color); border-radius:9px; display:flex; gap:12px; justify-content:space-between; margin-top:14px; padding:12px; }.transfer-launch p { color:var(--secondary-text-color); font-size:13px; line-height:1.35; margin:0; }.section-divider { border:0; border-top:1px solid var(--divider-color); margin:16px 0; }.dashboard-status { align-items:center; color:var(--secondary-text-color); display:flex; gap:8px; font-size:13px; margin-top:14px; }.dashboard-status::before { background:var(--primary-color); border-radius:50%; content:""; flex:none; height:8px; width:8px; }
        .workspace-title { display:flex; gap:12px; align-items:center; justify-content:space-between; margin-bottom:13px; } .eyebrow,.card-label { color:var(--secondary-text-color); font-size:11px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; }
        .selection { display:grid; grid-template-columns:1fr 42px 1fr; gap:12px; align-items:end; }
        label { color:var(--secondary-text-color); display:grid; font-size:14px; font-weight:600; gap:7px; } input { box-sizing:border-box; background:var(--input-fill-color, var(--secondary-background-color)); border:1px solid var(--input-idle-line-color, var(--divider-color)); border-radius:8px; color:var(--primary-text-color); font:inherit; padding:12px; width:100%; } input:focus { border-color:var(--primary-color); outline:2px solid color-mix(in srgb, var(--primary-color) 25%, transparent); }.input-row { display:flex; gap:8px; }.input-row input { min-width:0; }.picker-trigger { background:var(--secondary-background-color); border:1px solid var(--divider-color); border-radius:8px; color:var(--primary-text-color); cursor:pointer; font:inherit; font-weight:700; padding:0 12px; white-space:nowrap; }.picker-trigger:hover { border-color:#0878d1; color:#0878d1; }.arrow { color:var(--primary-color); font-size:25px; line-height:45px; text-align:center; }
        .transfer-workspace { margin-top:14px; }.transfer-controls { align-items:end; display:flex; flex-wrap:wrap; gap:12px; margin-top:12px; }.transfer-controls label { flex:1 1 260px; }.transfer-controls input[type=file] { display:block; margin-top:7px; max-width:100%; }.transfer-button { appearance:none; background:#0878d1; border:0; border-radius:8px; box-shadow:0 1px 2px rgb(0 0 0 / 18%); color:#fff; cursor:pointer; font:inherit; font-weight:700; padding:10px 15px; }.transfer-button:hover:not(:disabled) { background:#0669b6; }.transfer-button:disabled { cursor:wait; opacity:.65; }.transfer-preview { background:var(--card-background-color); border:1px solid var(--divider-color); border-left:4px solid var(--success-color, #2e7d32); border-radius:9px; margin-top:14px; padding:14px; }.transfer-preview.blocked { border-left-color:var(--error-color); }.transfer-preview-grid { display:grid; gap:12px; grid-template-columns:repeat(3,minmax(0,1fr)); margin-top:14px; }.transfer-preview-grid > div { background:var(--secondary-background-color); border-radius:8px; min-width:0; padding:10px; }.transfer-preview-grid span { color:var(--secondary-text-color); display:block; font-size:12px; }.transfer-preview-grid strong { display:block; font-family:var(--code-font-family,monospace); font-size:13px; margin-top:4px; overflow-wrap:anywhere; }.transfer-backup-notice { background:color-mix(in srgb, var(--error-color, #c62828) 9%, var(--card-background-color)); border-left:4px solid var(--error-color, #c62828); border-radius:8px; margin-top:14px; padding:10px 12px; }.transfer-backup-notice p { margin:5px 0 0; }.transfer-import-result { background:var(--secondary-background-color); border-left:4px solid var(--success-color, #2e7d32); border-radius:8px; margin-top:14px; padding:12px; }.transfer-import-result p { margin:6px 0 0; }.transfer-error { color:var(--error-color); font-size:13px; margin-top:9px; }
        .actions { display:flex; align-items:center; gap:10px; margin-top:14px; flex-wrap:wrap; } #analyze,.export-button { appearance:none; border:0; border-radius:8px; cursor:pointer; font:inherit; font-weight:700; padding:10px 15px; } #analyze { background:#0878d1; box-shadow:0 1px 2px rgb(0 0 0 / 18%); color:#fff; } #analyze:hover { background:#0669b6; } #analyze:focus-visible,.export-button:focus-visible { outline:3px solid color-mix(in srgb, #0878d1 35%, transparent); outline-offset:2px; } #analyze:disabled,.export-button:disabled { cursor:wait; opacity:.65; } #analyze:disabled { background:#6c8cab; } .export-button { background:var(--secondary-background-color); border:1px solid var(--divider-color); color:var(--primary-text-color); }.export-button:hover:not(:disabled) { border-color:#0878d1; color:#0878d1; } .read-only { color:var(--secondary-text-color); font-size:13px; }.export-status { color:var(--success-color, #2e7d32); font-size:13px; margin-top:9px; }.export-error { color:var(--error-color); font-size:13px; margin-top:9px; }
        .error { background:var(--error-color); border-radius:8px; color:var(--text-primary-color, white); margin-top:16px; padding:11px 13px; } .result { border-top:3px solid var(--primary-color); margin-top:22px; } .result.blocked { border-top-color:var(--error-color); } .result-heading,.result-actions { align-items:center; display:flex; justify-content:space-between; } .result-actions { gap:9px; }.copy-result { background:transparent; border:1px solid var(--divider-color); border-radius:7px; color:var(--primary-text-color); cursor:pointer; font:inherit; font-size:13px; font-weight:700; padding:7px 10px; }.copy-result:hover { border-color:#0878d1; color:#0878d1; }.copy-result:focus-visible { outline:3px solid color-mix(in srgb, #0878d1 35%, transparent); outline-offset:2px; }.result.ready .chip { color:var(--success-color, #2e7d32); } .result p { color:var(--secondary-text-color); margin-top:8px; }.copy-status { color:var(--success-color, #2e7d32); font-size:13px; font-weight:700; }
        .result-layout { display:grid; grid-template-columns:minmax(0, 1.2fr) minmax(300px, .8fr); gap:14px; margin-top:14px; }.result-primary,.result-secondary { align-content:start; display:grid; gap:12px; }.result-layout .assessment,.result-layout .timeline,.result-layout .stat-grid,.result-layout .findings,.result-layout .review-plan { margin-top:0; }.result-layout .assessment-grid { gap:8px; margin-top:8px; }.result-layout .assessment-card { min-height:76px; padding:11px; }.result-layout .assessment-card strong { font-size:16px; }.result-layout .assessment-card p { font-size:12px; line-height:1.3; margin-top:4px; }.result-layout .timeline { padding:13px; }.result-layout .timeline-track { margin-top:11px; }.result-layout .timeline-details { gap:8px; margin-top:9px; }.result-layout .timeline-details strong { font-size:12px; }.result-layout .stat-grid { grid-template-columns:1fr; gap:8px; }.result-layout .stat-card { padding:12px; }.result-layout .stat-card strong { font-size:13px; }.result-layout dl { gap:6px; grid-template-columns:1fr 1fr; margin-top:9px; }.result-layout dl div { display:grid; gap:2px; justify-content:initial; }.result-layout dd { text-align:left; }.result-layout .findings { gap:6px; }.result-layout .finding { font-size:13px; padding:9px; }
        .analysis-history { background:var(--card-background-color); border:1px solid var(--divider-color); border-radius:10px; box-shadow:var(--ha-card-box-shadow, none); margin-top:16px; padding:0 14px; }.analysis-history summary,.review-plan summary { align-items:center; cursor:pointer; display:flex; gap:14px; justify-content:space-between; list-style:none; padding:13px 0; }.analysis-history summary::-webkit-details-marker,.review-plan summary::-webkit-details-marker { display:none; }.analysis-history summary > span:first-child,.review-plan summary > span:first-child { font-size:15px; font-weight:700; }.analysis-history summary .eyebrow,.review-plan summary .eyebrow { display:block; margin-bottom:2px; }.analysis-history summary > span:last-child,.review-plan summary > span:last-child { color:var(--secondary-text-color); font-size:12px; text-align:right; }.history-list { border-top:1px solid var(--divider-color); display:grid; gap:7px; padding:10px 0 13px; }.history-entry { align-items:center; background:var(--secondary-background-color); border-left:3px solid var(--primary-color); border-radius:8px; display:flex; gap:12px; justify-content:space-between; padding:9px 10px; }.history-entry.blocked { border-left-color:var(--error-color); }.history-entry > div:first-child { align-items:center; display:flex; font-family:var(--code-font-family, monospace); font-size:12px; gap:7px; min-width:0; }.history-entry strong { overflow-wrap:anywhere; }.history-entry > div:first-child span { color:var(--secondary-text-color); }.history-actions { align-items:center; display:flex; flex:0 0 auto; gap:9px; }.history-actions > span { color:var(--secondary-text-color); font-size:11px; }.reuse-analysis { background:transparent; border:1px solid var(--divider-color); border-radius:7px; color:var(--primary-text-color); cursor:pointer; font:inherit; font-size:12px; font-weight:700; padding:6px 8px; }.reuse-analysis:hover { border-color:#0878d1; color:#0878d1; }
        .stat-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:20px; }.stat-card { background:var(--secondary-background-color); border:1px solid var(--divider-color); border-radius:9px; border-top:3px solid var(--primary-color); padding:16px; }.stat-card.target { border-top-color:var(--accent-color, #00a7d8); }.stat-card strong { display:block; font-family:var(--code-font-family, monospace); font-size:15px; margin-top:6px; overflow-wrap:anywhere; } dl { display:grid; gap:9px; margin:16px 0 0; } dl div { display:flex; gap:12px; justify-content:space-between; } dt { color:var(--secondary-text-color); } dd { margin:0; text-align:right; }
        .assessment { margin-top:20px; }.assessment-heading { display:flex; flex-direction:column; gap:4px; }.assessment-heading strong { font-size:17px; }.assessment-grid { display:grid; gap:12px; grid-template-columns:repeat(3, 1fr); margin-top:12px; }.assessment-card { background:var(--secondary-background-color); border:1px solid var(--divider-color); border-left:3px solid var(--primary-color); border-radius:9px; padding:14px; }.assessment-card.warning { border-left-color:var(--warning-color, #f6a700); }.assessment-card.error { border-left-color:var(--error-color); }.assessment-card span { color:var(--secondary-text-color); display:block; font-size:12px; font-weight:700; letter-spacing:.05em; text-transform:uppercase; }.assessment-card strong { display:block; font-size:17px; margin-top:4px; }.assessment-card p { font-size:13px; line-height:1.4; margin-top:6px; }
        .timeline { background:var(--secondary-background-color); border:1px solid var(--divider-color); border-radius:9px; margin-top:20px; padding:16px; }.timeline-heading { display:flex; flex-direction:column; gap:4px; }.timeline-heading strong { font-size:17px; }.timeline-track { align-items:center; display:grid; grid-template-columns:minmax(0, 1fr) 54px minmax(0, 1fr); margin-top:16px; }.timeline-segment { background:#0878d1; border-radius:6px; color:#fff; font-size:13px; font-weight:700; padding:10px 12px; text-align:center; }.timeline-segment.target { background:var(--accent-color, #00a7d8); }.timeline-connector { background:var(--primary-color); height:4px; }.timeline.gap .timeline-connector { background:var(--warning-color, #f6a700); }.timeline.overlap .timeline-connector,.timeline.reversed .timeline-connector { background:var(--error-color); }.timeline-details { display:grid; gap:12px; grid-template-columns:1fr 1.25fr 1fr; margin-top:13px; }.timeline-details div { display:grid; gap:3px; }.timeline-details div:last-child { text-align:right; }.timeline-details span { color:var(--secondary-text-color); font-size:12px; }.timeline-details strong { font-size:13px; }.timeline-relation { text-align:center; }.timeline-relation strong { font-family:var(--primary-font-family, sans-serif); }
        .findings { display:grid; gap:8px; list-style:none; margin:20px 0 0; padding:0; }.finding { align-items:flex-start; background:var(--secondary-background-color); border-radius:8px; display:flex; gap:10px; padding:11px; }.finding span { align-items:center; background:var(--primary-color); border-radius:50%; color:white; display:inline-flex; flex:0 0 19px; font-size:12px; font-weight:700; height:19px; justify-content:center; }.finding.error span { background:var(--error-color); }.finding.warning span { background:var(--warning-color, #f6a700); }
        .review-plan { background:var(--secondary-background-color); border-left:3px solid #0878d1; border-radius:8px; padding:0 14px; }.review-plan.blocked-plan { border-left-color:var(--error-color); padding:14px; }.review-plan h2 { font-size:18px; margin-top:4px; }.review-plan p { color:var(--secondary-text-color); margin-top:0; }.review-plan ol { display:grid; gap:7px; margin:0; padding:11px 0 14px 21px; }.review-plan li { padding-left:3px; }.review-plan > p { border-top:1px solid var(--divider-color); padding-top:11px; }
        .merge-confirmation,.merge-result { background:var(--secondary-background-color); border:1px solid var(--divider-color); border-left:3px solid #0878d1; border-radius:9px; padding:14px; }.merge-confirmation h2 { font-size:18px; margin-top:4px; }.merge-confirmation > p,.merge-result p { color:var(--secondary-text-color); line-height:1.4; margin-top:8px; }.confirm-check { align-items:flex-start; color:var(--primary-text-color); display:flex; font-size:13px; font-weight:500; gap:9px; margin-top:12px; }.confirm-check input { accent-color:#0878d1; flex:0 0 auto; margin:2px 0 0; width:auto; }.merge-confirmation button { background:#0878d1; border:0; border-radius:8px; color:white; cursor:pointer; font:inherit; font-weight:700; margin-top:14px; padding:10px 14px; }.merge-confirmation button:disabled { cursor:wait; opacity:.65; }.merge-result.success { border-left-color:var(--success-color, #2e7d32); }.merge-result strong { color:var(--success-color, #2e7d32); }.merge-error { color:var(--error-color); }
        .safety-notice { background:color-mix(in srgb, var(--error-color, #c62828) 9%, var(--card-background-color)); border:1px solid color-mix(in srgb, var(--error-color, #c62828) 38%, var(--divider-color)); border-left:4px solid var(--error-color, #c62828); border-radius:9px; margin-bottom:14px; padding:13px 15px; }.safety-notice strong { color:var(--error-color, #c62828); display:block; }.safety-notice p { line-height:1.4; margin-top:5px; }.safety-notice p:last-child { font-weight:600; }
        dialog.picker { background-color:var(--card-background-color, var(--primary-background-color, #202124)); border:1px solid var(--divider-color, #555); border-radius:12px; box-shadow:0 20px 60px rgb(0 0 0 / 55%); box-sizing:border-box; color:var(--primary-text-color); inset:0; margin:auto; max-height:calc(100dvh - 40px); max-width:660px; overflow:hidden; padding:22px; position:fixed; width:calc(100% - 40px); }
        dialog.picker::backdrop { background:rgb(0 0 0 / 70%); }
        dialog.workflow-dialog { background:var(--card-background-color, var(--primary-background-color)); border:1px solid var(--divider-color); border-radius:14px; box-shadow:0 20px 70px rgb(0 0 0 / 55%); box-sizing:border-box; color:var(--primary-text-color); display:flex; flex-direction:column; inset:0; margin:auto; max-height:min(92dvh, 920px); max-width:min(860px, calc(100vw - 32px)); overflow:hidden; padding:0; position:fixed; width:100%; }
        dialog.workflow-dialog:not([open]) { display:none; }
        dialog.workflow-dialog::backdrop { background:rgb(0 0 0 / 68%); backdrop-filter:blur(2px); }
        .dialog-header,.dialog-footer { align-items:center; background:var(--card-background-color); display:flex; flex:none; gap:14px; justify-content:space-between; padding:17px 20px; }.dialog-header { border-bottom:1px solid var(--divider-color); margin-bottom:0; }.dialog-header h2 { margin-top:4px; }.close-dialog { background:transparent; border:0; color:var(--secondary-text-color); cursor:pointer; font-size:30px; line-height:30px; padding:3px 7px; }.close-dialog:disabled { cursor:wait; opacity:.45; }.dialog-content { min-height:0; overflow:auto; padding:18px 20px; }.dialog-step + .dialog-step { border-top:1px solid var(--divider-color); margin-top:20px; padding-top:18px; }.step-title { align-items:flex-start; display:flex; gap:11px; margin-bottom:13px; }.step-title > span { align-items:center; background:var(--primary-color); border-radius:50%; color:var(--text-primary-color, white); display:flex; flex:none; font-size:13px; font-weight:700; height:25px; justify-content:center; width:25px; }.step-title strong { display:block; font-size:15px; }.step-title p { color:var(--secondary-text-color); font-size:13px; line-height:1.4; margin-top:3px; }.transfer-target { flex:1 1 260px; min-width:0; }.transfer-target .input-row { align-items:stretch; }.transfer-target output { align-items:center; background:var(--input-fill-color, var(--secondary-background-color)); border:1px solid var(--input-idle-line-color, var(--divider-color)); border-radius:8px; display:flex; min-height:44px; min-width:0; overflow-wrap:anywhere; padding:8px 11px; width:100%; }.file-selection { color:var(--secondary-text-color); font-size:13px; margin:9px 0 12px; }.dialog-footer { border-top:1px solid var(--divider-color); }.secondary-button { background:var(--secondary-background-color); border:1px solid var(--divider-color); border-radius:8px; color:var(--primary-text-color); cursor:pointer; font:inherit; font-weight:700; padding:9px 14px; }.secondary-button:disabled { cursor:wait; opacity:.5; }.dialog-footer .read-only { flex:1; }
        .picker-heading { align-items:flex-start; display:flex; justify-content:space-between; margin-bottom:17px; }.close-picker { background:transparent; border:0; color:var(--secondary-text-color); cursor:pointer; font-size:28px; line-height:28px; padding:0 5px; }.picker-count { color:var(--secondary-text-color); font-size:13px; margin:11px 0; }.picker-options { border:1px solid var(--divider-color); border-radius:8px; max-height:min(420px, calc(100dvh - 230px)); overflow:auto; }.picker-option { background:transparent; border:0; border-bottom:1px solid var(--divider-color); color:var(--primary-text-color); cursor:pointer; display:flex; font-family:var(--code-font-family, monospace); font-size:14px; font-weight:400; justify-content:space-between; padding:13px; text-align:left; width:100%; }.picker-option:hover { background:var(--secondary-background-color); }.picker-option span:last-child { color:#0878d1; font-family:var(--primary-font-family, sans-serif); font-size:12px; font-weight:700; }.picker-option:last-child { border-bottom:0; }.empty { color:var(--secondary-text-color); margin:0; padding:18px; }
        @media (max-width:900px) { .workflow-grid { grid-template-columns:1fr; }.result-layout { grid-template-columns:1fr; }.result-layout .stat-grid { grid-template-columns:1fr 1fr; }.result-layout dl { grid-template-columns:1fr; } }
        @media (max-width:680px) { main { padding:18px 14px 30px; } header,.selection { display:block; } header .chip { display:inline-block; margin-top:14px; } .result-heading,.history-entry { align-items:flex-start; flex-direction:column; gap:10px; }.result-actions { align-items:flex-end; flex-direction:column; } .history-actions { width:100%; }.history-actions > span { flex:1; }.arrow { display:none; } label + .arrow + label { margin-top:14px; }.assessment-grid,.stat-grid,.timeline-details,.result-layout .stat-grid { grid-template-columns:1fr; }.timeline-details div:last-child,.timeline-relation { text-align:left; } .workspace,.result { padding:14px; } dialog.picker { padding:17px; width:calc(100% - 24px); } dialog.workflow-dialog { max-height:94dvh; max-width:calc(100vw - 16px); }.dialog-header,.dialog-footer { padding:14px; }.dialog-content { padding:14px; }.export-controls { grid-template-columns:1fr; }.transfer-launch { align-items:stretch; flex-direction:column; } }
        @media (max-width:680px) { .transfer-preview-grid { grid-template-columns:1fr; } }
      </style>
      <main>
        <header>
          <div><h1>Langzeitstatistiken verwalten</h1><p class="subtitle">Langzeitstatistiken sicher prüfen, zusammenführen oder zwischen Installationen übertragen.</p></div>
          <span class="chip">Analyse und Übertragung</span>
        </header>
        <aside class="safety-notice" role="alert"><strong>Vor jeder Übernahme: Backup erstellen</strong><p>Erstelle ein vollständiges Home-Assistant-Backup und prüfe, dass es verfügbar ist. StatFusion verändert historische Recorder-Daten dauerhaft; die Nutzung erfolgt auf eigene Gefahr. Für Datenverlust oder Folgeschäden übernimmt das Projektteam – soweit gesetzlich zulässig – keine Haftung.</p></aside>
        <div class="workflow-grid">
          <section class="workspace merge-workspace">
            <div class="workspace-title"><div><span class="eyebrow">Arbeitsbereich 1</span><h2>In dieser Installation zusammenführen</h2></div><span class="chip">Recorder-Statistiken</span></div>
            <p class="workspace-description">Vergleiche zwei Statistiken auf dieser Installation. Die Prüfung bleibt unverbindlich und ändert noch keine Daten.</p>
            <div class="selection">
              <label>Quelle<span class="input-row"><input id="source" list="statistics" value="${escapeHtml(this._source)}" placeholder="sensor.alte_energie"><button class="picker-trigger" type="button" data-picker-role="source">Liste</button></span></label>
              <div class="arrow">→</div>
              <label>Ziel<span class="input-row"><input id="target" list="statistics" value="${escapeHtml(this._target)}" placeholder="sensor.neue_energie"><button class="picker-trigger" type="button" data-picker-role="target">Liste</button></span></label>
            </div>
            <datalist id="statistics">${options}</datalist>
            <div class="actions"><button id="analyze" ${this._loading ? "disabled" : ""}>${this._loading ? "Prüfung läuft…" : "Kompatibilität prüfen"}</button><span class="read-only">Die Prüfung verändert keine Daten.</span></div>
            ${this._error ? `<div class="error" role="alert">${this._error}</div>` : ""}
          </section>
          <section class="workspace transfer-workspace">
            <div class="workspace-title"><div><span class="eyebrow">Arbeitsbereich 2</span><h2>Zwischen Installationen übertragen</h2></div><span class="chip">JSON-Datei</span></div>
            <p class="workspace-description">Exportiere auf dem alten System eine Statistik oder importiere eine Exportdatei auf diesem System.</p>
            <hr class="section-divider">
            <label>Quellstatistik für den Export<span class="export-selection"><input id="export-source-id" list="statistics" value="${escapeHtml(this._exportStatistic)}" placeholder="sensor.alte_energie"><button class="picker-trigger" type="button" data-picker-role="export-source">Liste</button></span></label>
            <div class="actions"><button class="export-button" id="export-source" type="button" ${this._exportLoading ? "disabled" : ""}>${this._exportLoading ? "Export läuft…" : "Quelle exportieren"}</button><span class="read-only">Exportiert eine geprüfte JSON-Datei.</span></div>
            ${this._exportStatus ? `<p class="export-status" role="status">${this._exportStatus}</p>` : ""}
            ${this._exportError ? `<p class="export-error" role="alert">${this._exportError}</p>` : ""}
            <div class="transfer-launch"><p>Datei auswählen, Ziel prüfen und alle Import-Schritte gemeinsam in einem Dialog durchgehen.</p><button class="transfer-button" id="open-transfer-dialog" type="button">Übertragung öffnen</button></div>
          </section>
        </div>
        ${this._resultTemplate()}
        ${this._historyTemplate()}
      </main>
      ${this._transferDialogTemplate()}
      ${this._pickerTemplate()}`;
    this.shadowRoot.innerHTML = this._localize(markup);
    const transferDialog = this.shadowRoot.querySelector("#transfer-dialog");
    if (transferDialog && this._transferDialogOpen && !transferDialog.open) transferDialog.showModal();
    const pickerDialog = this.shadowRoot.querySelector("#picker-dialog");
    if (pickerDialog && !pickerDialog.open) pickerDialog.showModal();
    this.shadowRoot.querySelector("#analyze").addEventListener("click", () => this._analyze());
    this.shadowRoot.querySelector("#export-source").addEventListener("click", () => this._exportStatistics());
    this.shadowRoot.querySelector("#open-transfer-dialog").addEventListener("click", () => this._openTransferDialog());
    this.shadowRoot.querySelector("#close-transfer-dialog").addEventListener("click", () => this._closeTransferDialog());
    this.shadowRoot.querySelector("#cancel-transfer-dialog").addEventListener("click", () => this._closeTransferDialog());
    if (transferDialog) {
      transferDialog.addEventListener("cancel", (event) => {
        event.preventDefault();
        this._closeTransferDialog();
      });
      transferDialog.addEventListener("click", (event) => {
        if (event.target === transferDialog) this._closeTransferDialog();
      });
    }
    this.shadowRoot.querySelector("#preview-transfer").addEventListener("click", () => this._previewTransfer());
    this.shadowRoot.querySelector("#transfer-file").addEventListener("change", (event) => {
      this._transferFile = event.target.files?.[0] || null;
      this._transferPreview = null;
      this._transferImportResult = null;
      this._transferError = "";
      this._render();
    });
    const transferImportButton = this.shadowRoot.querySelector("#import-transfer");
    const transferConfirmations = [
      this.shadowRoot.querySelector("#transfer-backup-confirmed"),
      this.shadowRoot.querySelector("#transfer-warnings-confirmed"),
      this.shadowRoot.querySelector("#transfer-import-confirmed"),
    ];
    if (transferImportButton && transferConfirmations.every(Boolean)) {
      const syncTransferImportButton = () => {
        transferImportButton.disabled = this._transferImportLoading
          || !transferConfirmations.every((checkbox) => checkbox.checked);
      };
      transferConfirmations.forEach((checkbox) => checkbox.addEventListener("change", syncTransferImportButton));
      transferImportButton.addEventListener("click", () => this._importTransfer());
      syncTransferImportButton();
    }
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
      this._transferPreview = null;
      this._transferImportResult = null;
    });
    this.shadowRoot.querySelector("#export-source-id").addEventListener("input", (event) => {
      this._exportStatistic = event.target.value;
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
    if (pickerDialog) {
      pickerDialog.addEventListener("cancel", (event) => {
        event.preventDefault();
        this._closePicker();
      });
      pickerDialog.addEventListener("click", (event) => {
        if (event.target === pickerDialog) this._closePicker();
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
    if (this._pickerRole === "export-source") this._exportStatistic = statisticId;
    if (this._pickerRole === "target") {
      this._target = statisticId;
      this._transferPreview = null;
      this._transferImportResult = null;
    }
    if (this._pickerRole === "transfer-target") {
      this._transferTarget = statisticId;
      this._transferPreview = null;
      this._transferImportResult = null;
    }
    this._closePicker();
  }

  _pickerTemplate() {
    if (!this._pickerRole) return "";
    const title = this._pickerRole === "source"
      ? "Quellstatistik auswählen"
      : this._pickerRole === "export-source"
        ? "Quellstatistik für den Export"
        : "Zielstatistik auswählen";
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
      <dialog class="picker" id="picker-dialog" aria-label="${title}">
          <div class="picker-heading"><div><span class="eyebrow">Auswahl</span><h2>${title}</h2></div><button class="close-picker" id="close-picker" type="button" aria-label="Auswahl schließen">×</button></div>
          <input id="statistic-search" value="${escapeHtml(this._pickerQuery)}" placeholder="Statistik suchen …" autocomplete="off">
          <p class="picker-count">${detail}</p>
          <div class="picker-options">${options || '<p class="empty">Keine passende Statistik gefunden.</p>'}</div>
      </dialog>`;
  }
}

customElements.define("statfusion-panel", StatFusionPanel);
