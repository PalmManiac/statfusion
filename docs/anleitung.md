# StatFusion – Anleitung

StatFusion analysiert und kopiert Home-Assistant-Langzeitstatistiken aus dem
Recorder. Das ist hilfreich, wenn eine alte Entität durch eine neue ersetzt
wurde und die Stundenwerte der alten Entität in der Historie der neuen
erscheinen sollen.

## Vor dem Start

- Erstelle ein vollständiges Home-Assistant-Backup und prüfe, ob es die
  Recorder-Datenbank enthält. Sichere eine externe Recorder-Datenbank separat.
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

- **Falsche Reihenfolge:** Die Übernahme wird blockiert. Wähle die ältere
  Statistik als Quelle und die neuere als Ziel.
- **Überschneidende Stunden:** Prüfe Anzahl und Zeitraum der identischen
  Stunden. Wähle, ob bei diesen Stunden die Werte der alten Quelle oder des
  neuen Ziels erhalten bleiben. Fehlende Quellstunden werden in beiden Fällen
  ergänzt; alle anderen Zielstunden und die Quelle bleiben unverändert. Du
  kannst vor dem Schreiben abbrechen. Die Quelle kann nicht gewinnen, wenn der
  Recorder das gespeicherte Mittelwertgewicht dieser Stunden nicht sicher
  ersetzen kann.
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

StatFusion prüft die Statistiken und exakt dieselben überschneidenden Stunden
unmittelbar vor dem Schreiben erneut. Die gewählte Regel gilt nur für identische Stunden;
fehlende Quellstunden werden ergänzt. Die Quelle bleibt erhalten. StatFusion
wartet auf den Recorder und verifiziert die resultierenden Werte. Werte werden
unverändert kopiert; Summen werden weder addiert noch normalisiert. Stelle das
Backup wieder her, falls das Ergebnis nicht deinen Erwartungen entspricht.

## Statistiken zwischen Home-Assistant-Installationen übertragen (1.1.0)

StatFusion 1.1.0 kann die stündlichen Langzeitdaten einer Statistik von einer
älteren auf eine neuere Home-Assistant-Installation übertragen. Die
Installationen verbinden sich nicht direkt: Du lädst die JSON-Datei auf der
Quelle herunter und überträgst sie selbst zum Ziel.

1. Wähle auf der Quellinstallation die Statistik und klicke auf **Quelle
   exportieren**.
2. Wähle auf der Zielinstallation die vorhandene Zielstatistik, lade die
   exportierte JSON-Datei und erstelle die Importvorschau.
3. Prüfe Quelle und Ziel, Einheiten, Datenform, Zeitraum, Lücken und alle
   Hinweise. Gleiche Statistik-IDs sind zulässig, wenn sie zu zwei verschiedenen
   Installationen gehören.
4. Wenn die Vorschau gleiche Stunden meldet, wähle, ob die exportierten Werte
   oder die bestehenden Zielwerte erhalten bleiben sollen. Das Ersetzen durch
   Exportwerte kann gesperrt sein, wenn Home Assistant Mittelwertgewichte nicht
   sicher aktualisieren kann.
5. Erstelle ein vollständiges Home-Assistant-Backup und prüfe, ob es die
   Recorder-Datenbank enthält. Sichere eine externe Datenbank separat. Bestätige
   das Backup, prüfe Hinweise und Zuordnung und bestätige ausdrücklich den Import.
6. Warte auf die Erfolgsmeldung nach der Verifikation und prüfe die Zielhistorie.

StatFusion blockiert inkompatible Statistiken und verlangt für gleiche Stunden
eine ausdrückliche Auswahl. StatFusion rechnet Einheiten nicht um und verändert
die exportierten Werte nicht. Bewahre die Exportdatei auf, bis du die
Zielhistorie kontrolliert hast. Die Datei kann sensible Energie- oder
Verbrauchshistorie enthalten; speichere und übertrage sie entsprechend
vorsichtig. Unterstützt werden höchstens 250.000 Stundenwerte und Dateien bis
64 MiB.

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
  collision_resolution: target # nur bei überlappenden Stunden erforderlich
```

Das Dashboard richtet sich nach der Spracheinstellung von Home Assistant und
unterstützt derzeit Deutsch und Englisch. Die Analysehistorie bleibt nur
während der aktuellen Dashboard-Sitzung erhalten.
