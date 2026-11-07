# Anforderungen – Lernspiel Informatik Klasse 7

## Ziel
Erstelle ein vollständiges browserbasiertes Lernspiel für Schülerinnen und Schüler der Klasse 7. Die fachlichen Inhalte stehen in `fachinhalte.md`.

Das Spiel soll sich wie ein kleines Lernabenteuer und nicht wie ein gewöhnliches digitales Arbeitsblatt anfühlen.

## Technik
- HTML5
- CSS3
- Vanilla JavaScript
- keine Frameworks
- keine externen Bibliotheken
- kein npm
- kein Buildprozess
- kein Backend
- keine Datenbank
- keine externen APIs
- statische Website, direkt für GitHub Pages geeignet
- ausschließlich relative Datei- und Ressourcenpfade

## Grundstruktur des Projekts
Mindestens:
- `index.html`
- `css/style.css`
- `js/app.js`
- `js/levels.js`
- `assets/`
- `README.md`
- geeignete GitHub-Pages-Konfiguration bzw. Workflow, falls erforderlich

Lerninhalte und Spiellogik sollen möglichst getrennt sein, damit Fragen, Texte und Level später leicht geändert werden können.

## Rahmenhandlung
Ein digitales Computersystem ist noch nicht vollständig funktionsfähig. Die Lernenden reisen mit einer freundlichen digitalen Spielfigur durch verschiedene Bereiche. Mit jedem erfolgreich absolvierten Level wird ein weiterer Teil des Systems aktiviert bzw. repariert.

Die Figur soll:
- begrüßen
- Aufgaben verständlich einführen
- Inhalte kurz erklären
- Hinweise geben
- auf richtige und falsche Antworten reagieren
- Fortschritt kommentieren
- nach Levelabschluss gratulieren

Die Figur soll selbst erstellt werden, z. B. mit HTML, CSS oder SVG, und keine geschützte Figur nachahmen.

## Level
Die sieben Themenbereiche aus `fachinhalte.md` bilden die Level:
1. Hardware
2. EVA-Prinzip
3. Bits und Bytes
4. Dateien und Codierung
5. Betriebssystem
6. Objekte in der Informatik
7. Klassen in der Informatik

## Didaktischer Levelaufbau
Nicht den gesamten Inhalt auf einmal zeigen. Jedes Level in mehrere kleine Lernschritte teilen.

Grundmuster:
1. kurze Einführung durch die Spielfigur
2. kleine Informationseinheit
3. passende interaktive Aktivität
4. unmittelbares Feedback
5. nächster Lernschritt
6. weitere Aktivität
7. Abschlussmission
8. kurze Zusammenfassung
9. Punkte/Sterne und Übergang zum nächsten Level

Sprache altersgerecht, klar und fachlich korrekt für Klasse 7.

## Aufgabenformate
Abwechslungsreiche Formen verwenden, nicht nur Multiple Choice:
- Multiple Choice
- Richtig/Falsch
- Zuordnungen
- Sortieraufgaben
- Drag-and-drop
- Kategorien
- interaktive Schalter
- Fehlersuche
- kleine Simulationen
- Diagramme vervollständigen
- Abschlussmissionen

Drag-and-drop möglichst zusätzlich durch Anklicken oder Tastatur bedienbar machen.

### Beispiele je Level
**Hardware:** Komponenten ihren Aufgaben und menschlichen Vergleichen zuordnen; virtuellen Computer zusammensetzen; Fehlerdiagnose.

**EVA:** Eingabe, Verarbeitung und Ausgabe ordnen; Geräte oder Alltagssituationen zuordnen; kompletten EVA-Ablauf zusammensetzen.

**Bits und Bytes:** 0/1-Schalter; acht Bits als Byte erkennen; einfache Codieraufgabe mit direkt im Spiel bereitgestellter Tabelle; Nachricht entschlüsseln.

**Dateien:** Dateiname und Dateiendung erkennen; Dateien sortieren; Codierungsarten zuordnen; durcheinandergeratenes Dateisystem ordnen.

**Betriebssystem:** Betriebssystem und Anwendung unterscheiden; Aufgaben zuordnen; Problemsituationen lösen; Systembereiche sinnvoll ordnen.

**Objekte:** Objekt, Attribut, Attributwert und Methode unterscheiden; Objektdiagramm vervollständigen; virtuelles Fahrrad konfigurieren.

**Klassen:** Klasse und Objekt unterscheiden; Klassendiagramm vervollständigen; Attribute, Datentypen und Methoden zuordnen; aus einem Bauplan ein Objekt ableiten.

## Fortschrittsleiste
Oben dauerhaft eine gut erkennbare Fortschrittsanzeige mit allen sieben Leveln.

Status:
- Grau = noch nicht bearbeitet
- Blau = aktuell geöffnet
- Grün = erfolgreich abgeschlossen
- Gelb = übersprungen

Status niemals nur über Farbe vermitteln, sondern zusätzlich mit Symbol/Text.

Zusätzlich anzeigen:
- aktuelles Level
- Gesamtfortschritt
- Punkte
- Sterne
- abgeschlossene Level
- übersprungene Level

## Level überspringen
Jedes Level darf übersprungen werden.

Schaltfläche: `Level überspringen`

Vorher Bestätigung:
> Dieses Level wird als übersprungen markiert. Du kannst es später nachholen.

Danach:
- Level gelb markieren
- nächstes Level öffnen
- übersprungenes Level weiterhin auswählbar halten
- bei späterem erfolgreichen Abschluss von Gelb zu Grün wechseln

## Feedback und Hilfen
Bei richtiger Antwort:
- positives visuelles Feedback
- kurze fachliche Begründung
- Reaktion der Spielfigur

Bei falscher Antwort:
- keine abwertende Rückmeldung
- nicht nur „Falsch!“ anzeigen
- hilfreichen Hinweis zum Denkweg geben
- erneuten Versuch ermöglichen

Nach mehreren Fehlversuchen stärkere Hilfe anbieten und auf Wunsch Lösung erklären.

## Punkte und Sterne
Einfaches motivierendes System:
- Punkte für richtige Lösungen
- Bonus für ersten Versuch
- Bonus für Lösung ohne Hinweis
- bis zu drei Sterne pro Level

Wiederholtes Spielen darf nicht unbegrenzt Gesamtpunkte erzeugen. Pro Level soll vorzugsweise nur das beste bisherige Ergebnis zählen.

Lernfortschritt ist wichtiger als Wettbewerb.

## Speicherung
`localStorage` verwenden.

Mindestens speichern:
- Levelstatus
- abgeschlossen/übersprungen
- Punkte
- Sterne
- bestes Levelergebnis
- aktueller Lernfortschritt

Nach Neuladen automatisch wiederherstellen.

Funktion `Fortschritt zurücksetzen` mit Sicherheitsabfrage einbauen.

## Abschluss
Nach Level 7 Abschlussansicht mit:
- Gesamtfortschritt
- Punkten
- Sternen
- abgeschlossenen Leveln
- übersprungenen Leveln

Falls noch gelbe Level vorhanden sind, sollen sie direkt nachholbar sein.

Wenn alle sieben Level abgeschlossen sind:
- Computersystem vollständig aktivieren
- kleine Abschlussanimation
- digitales Abzeichen
- Gratulation der Spielfigur

## Gestaltung
- modern
- freundlich
- motivierend
- übersichtlich
- für Klasse 7 geeignet, nicht zu kindlich
- klare Karten und Schaltflächen
- spielerische Visualisierung
- kleine, sinnvolle Animationen
- responsive für Desktop, Tablet und Smartphone

Keine extern geladenen Bilder, Schriftarten oder Audiodateien. Einfache Visuals selbst mit HTML/CSS/SVG erstellen.

## Barrierearme Umsetzung
- semantisches HTML
- Tastaturbedienung
- sichtbare Fokusmarkierungen
- ausreichende Kontraste
- sinnvolle ARIA-Beschriftungen
- Alternativtexte für relevante Grafiken
- Statusanzeigen nicht nur über Farbe
- `prefers-reduced-motion` berücksichtigen
- verständliche Fehlermeldungen

## Datenschutz
- keine personenbezogenen Daten
- keine Anmeldung
- keine Schülernamen
- keine Werbung
- keine Tracker
- keine externen Analysedienste
- keine Übertragung von Spieldaten
- Lernstand ausschließlich lokal im Browser

## Qualität und Tests
Vor Abschluss prüfen:
- Startseite funktioniert
- alle sieben Level erreichbar und vollständig spielbar
- richtige und falsche Antworten korrekt erkannt
- Hinweise funktionieren
- Levelabschluss funktioniert
- Punkte und Sterne funktionieren
- Fortschrittsanzeige funktioniert
- Überspringen führt zu Gelb
- Nachholen führt von Gelb zu Grün
- localStorage speichert/wiederherstellt korrekt
- Reset funktioniert
- responsive Darstellung funktioniert
- Tastaturbedienung funktioniert
- relative Pfade funktionieren
- keine JavaScript-Fehler
- GitHub-Pages-Betrieb funktioniert

## GitHub Pages
Projekt so vorbereiten, dass es als statische Website über GitHub Pages veröffentlicht werden kann. Bei Änderungen am Hauptbranch soll eine geeignete automatische Veröffentlichung möglich sein.

Wenn eine notwendige GitHub-Einstellung nicht automatisiert vorgenommen werden kann, am Ende exakt den manuellen Schritt nennen.

## README
Deutsche `README.md` mit:
- Name/Ziel des Spiels
- Zielgruppe
- Lernziele und sieben Level
- Spielprinzip
- Punkte/Sterne
- Projektstruktur
- lokale Nutzung
- Speicherung
- Datenschutz
- Ändern/Ergänzen der Aufgaben
- Veröffentlichung über GitHub Pages

## Arbeitsweise für den Coding-Agenten
1. `fachinhalte.md` und diese Datei vollständig lesen.
2. Vorhandenes Repository untersuchen.
3. Kurzen Umsetzungsplan erstellen.
4. Vollständige Projektstruktur erzeugen.
5. Grundlayout, Navigation, Spielfigur und Fortschrittssystem implementieren.
6. Alle sieben Level vollständig implementieren.
7. Punkte, Sterne, Überspringen und localStorage implementieren.
8. Responsive Gestaltung und Barrierefreiheit umsetzen.
9. GitHub-Pages-Veröffentlichung vorbereiten.
10. Anwendung vollständig testen und Fehler selbstständig beseitigen.

Keine bloße Demo und keine TODO-/Platzhalter-Funktionen. Alle sieben Level müssen tatsächlich spielbar sein.
