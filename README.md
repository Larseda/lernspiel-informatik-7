# Systemretter 7 – Mission Computerwelt

**Systemretter 7** ist ein browserbasiertes Lernabenteuer für Klasse 7.  
Die Lernenden reparieren ein ausgefallenes Computersystem gemeinsam mit der Begleitfigur **Byte**.

## Zielgruppe
Schülerinnen und Schüler der Klassenstufe 7.

## Lernziele und Level
Die sieben Stationen orientieren sich direkt an `fachinhalte.md`:

1. Hardware-Werkstatt  
2. EVA-Kontrollraum  
3. Bit-und-Byte-Labor  
4. Datei-Archiv  
5. Betriebssystem-Zentrale  
6. Objekt-Werkstatt  
7. Klassen-Konstruktionsraum

## Spielprinzip
- Startsequenz mit Missionseinführung durch Byte
- Interaktive Weltkarte mit sichtbar verbundenen Stationen
- Pro Station mehrere Missionen mit visueller Rückmeldung
- Nach jeder Station sichtbare Aktivierung im System
- Abschlussansicht mit Gesamtwertung und Abzeichen

## Umgesetzte Interaktionsformen
- Klicken auf grafische Bereiche
- Platzieren von Bauteilen (Drag-and-drop + Klick-Alternative)
- Visuelle Zuordnungen
- Sortier- und Reihenfolgeaufgaben
- Schalter/Bit-Toggles
- Dateisortierung in Ordner
- Fehlerdiagnose in Szenen
- Interaktive Objektkonfiguration
- Klassendiagramm per Token-Aufbau

## Punkte und Sterne
- Punkte pro Mission
- Abzug bei Fehlversuchen/Hilfen
- Sterne je Level nach erreichter Quote
- Pro Level zählt dauerhaft das beste Ergebnis

## Speicherung
`localStorage` speichert:
- Start-/Fortschrittsstatus
- Levelstatus (gesperrt, verfügbar, aktuell, abgeschlossen, übersprungen)
- Beste Punkte/Sterne je Level
- Kartenposition der Spielfigur

## Bedienung und Barrierearmut
- Maus-, Touch- und Tastaturbedienung
- Sichtbare Fokusmarkierungen
- ARIA-Labels in zentralen Spielbereichen
- Status nicht nur über Farben (Symbole + Text)
- `prefers-reduced-motion` berücksichtigt

## Projektstruktur
```text
.
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   └── levels.js
├── fachinhalte.md
├── anforderungen.md
└── .github/workflows/pages.yml
```

## Lokale Nutzung
1. Repository klonen oder herunterladen  
2. `index.html` im Browser öffnen  
3. Spielen (kein Buildprozess, keine Abhängigkeiten)

## Datenschutz
- keine Anmeldung
- keine personenbezogenen Daten
- keine externen Tracker/Analysedienste
- Lernstand nur lokal im Browser

## GitHub Pages
Das Projekt ist als statische Website für GitHub Pages ausgelegt.  
Falls nötig: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
