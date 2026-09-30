# StatFusion – Anleitung

StatFusion analysiert und kopiert Home-Assistant-Langzeitstatistiken aus dem
Recorder. Das ist hilfreich, wenn eine alte Entität durch eine neue ersetzt
wurde und die Stundenwerte der alten Entität in der Historie der neuen
erscheinen sollen.

## Vor dem Start

- Erstelle ein vollständiges Home-Assistant-Backup und stelle sicher, dass es
  für eine Wiederherstellung verfügbar ist.
- Wähle die ältere Statistik als **Quelle** und die Statistik, die fehlende
  Stunden erhalten soll, als **Ziel**.
- Prüfe, dass beide Statistiken dieselbe Messgröße und denselben Energiefluss
  beschreiben.

StatFusion ändert historische Recorder-Daten dauerhaft. Die Nutzung erfolgt
auf eigene Gefahr. Das Projektteam übernimmt – soweit gesetzlich zulässig –
keine Haftung für Datenverlust oder Folgeschäden.

## Quelle und Ziel analysieren

1. Öffne **StatFusion** über das HA-Seitenmenü.
2. Wähle Quelle und Ziel aus. Du kannst die Statistik-ID eingeben oder über
   **Liste** die verfügbaren Statistiken durchsuchen.
3. Starte **Kompatibilität prüfen**.
4. Prüfe beide Zeiträume, Datenform, Einheit, Energieflussbewertung und alle
   Hinweise.

Die Analyse ist schreibgeschützt. **Bereit zur Prüfung** bedeutet nur, dass
keine blockierende technische Abweichung erkannt wurde. Es bestätigt nicht,
dass die Historien dieselbe Bedeutung haben oder alle Warnungen bedenkenlos
ignoriert werden können.

### Hinweise, die geprüft werden müssen

- **Überschneidung oder falsche Reihenfolge:** Die Übernahme wird blockiert.
  Wähle eine ältere Quelle und ein neueres Ziel ohne überlappende Zeiträume.
- **Einheitenumrechnung oder inkompatible Datenformen:** Die Übernahme wird
  blockiert. StatFusion rechnet keine Werte um.
- **Zeitlücke:** Die Übernahme kann nach Prüfung fortgesetzt werden; der
  fehlende Zeitraum bleibt dabei bestehen.
- **Möglicherweise entgegengesetzte Energieflüsse:** Prüfe, ob die Statistiken
  wirklich denselben Energiefluss beschreiben.
- **Unterschiedliche kumulative Ausgangswerte:** Werte werden unverändert
  kopiert. StatFusion addiert oder normalisiert Summen nicht; ein sichtbarer
  Sprung kann bestehen bleiben.

## Stundenwerte übernehmen

Fahre erst fort, wenn du die Hinweise geprüft und Quelle sowie Ziel bestätigt
hast:

1. Stelle sicher, dass das vollständige Home-Assistant-Backup abgeschlossen
   und verfügbar ist.
2. Bestätige das Backup, die Prüfung der Warnungen und die Zuordnung von Quelle
   und Ziel.
3. Wähle **Stundenwerte übernehmen** und bestätige die abschließende
   Browser-Rückfrage.
4. Warte auf die Erfolgsmeldung und prüfe anschließend die Zielhistorie.

StatFusion prüft die Statistiken unmittelbar vor dem Schreiben erneut. Es
kopiert die Quellstunden nur, wenn keiner ihrer Zeitpunkte bereits im Ziel
vorhanden ist. Quelle und bestehende Zielstunden bleiben erhalten; danach wartet
StatFusion auf den Recorder und verifiziert die übernommenen Werte. Wenn auch
nur ein Zielzeitpunkt bereits vorhanden ist oder die Verifikation fehlschlägt,
meldet die Aktion einen Fehler. Stelle das Backup wieder her, falls das
Ergebnis nicht deinen Erwartungen entspricht.

## Aktionen in den Entwicklerwerkzeugen

Administratoren können die Analyse unter **Entwicklerwerkzeuge → Aktionen**
starten. Diese Aktion verändert keine Recorder-Daten:

```yaml
action: statfusion.analyze
data:
  source_statistic_id: sensor.old_energy
  target_statistic_id: sensor.new_energy
```

Die Zusammenführungsaktion verlangt alle ausdrücklichen Bestätigungen und
wiederholt die Sicherheitsprüfungen direkt vor dem Schreiben:

```yaml
action: statfusion.merge
data:
  source_statistic_id: sensor.old_energy
  target_statistic_id: sensor.new_energy
  backup_confirmed: true
  warnings_confirmed: true
  confirm: true
```

Das Dashboard richtet sich nach der Spracheinstellung von Home Assistant und
unterstützt derzeit Deutsch und Englisch. Die Analysehistorie bleibt nur
während der aktuellen Dashboard-Sitzung erhalten.
