# Systemretter 7 – Lernspiel Informatik Klasse 7

## Name und Ziel des Spiels
**Systemretter 7** ist ein browserbasiertes Lernspiel, in dem ein digitales Computersystem Schritt für Schritt repariert wird.  
Das Ziel ist, zentrale Informatik-Grundbegriffe aus Klasse 7 spielerisch, fachlich korrekt und motivierend zu festigen.

## Zielgruppe
Schülerinnen und Schüler der **Klassenstufe 7**.

## Lernziele und sieben Level
Das Spiel umfasst sieben fachliche Lernbereiche:
1. Hardware
2. EVA-Prinzip
3. Bits und Bytes
4. Dateien und Codierung
5. Betriebssystem
6. Objekte in der Informatik
7. Klassen in der Informatik

## Spielprinzip
- Jedes Level enthält mehrere Lernschritte mit kurzer Einführung, Information und interaktiven Aufgaben.
- Eine digitale Spielfigur begleitet durch alle Schritte, gibt Hinweise und reagiert auf Antworten.
- Nach jedem Level wird der Fortschritt aktualisiert und das nächste Systemmodul freigeschaltet.
- Level können übersprungen und später nachgeholt werden.

## Punkte und Sterne
- Punkte gibt es für richtige Lösungen.
- Bonuspunkte:
  - für richtige Lösung im ersten Versuch
  - für Lösung ohne Hinweis
- Pro Level sind bis zu **3 Sterne** möglich.
- Für die Gesamtwertung zählt je Level nur das **beste bisher erreichte Ergebnis**.

## Projektstruktur
```text
.
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   └── levels.js
├── assets/
│   └── .gitkeep
├── fachinhalte.md
├── anforderungen.md
└── .github/
    └── workflows/
        └── pages.yml
```

## Lokale Nutzung
1. Repository klonen oder herunterladen.
2. `index.html` im Browser öffnen.
3. Spiel direkt ohne Buildprozess starten (reine statische Website).

## Speicherung
Der Lernstand wird lokal im Browser mit `localStorage` gespeichert:
- Levelstatus (offen, abgeschlossen, übersprungen)
- Punkte und Sterne
- bestes Ergebnis pro Level
- aktueller Lernfortschritt

Es gibt eine Funktion **„Fortschritt zurücksetzen“** mit Sicherheitsabfrage.

## Datenschutz
- Keine Anmeldung
- Keine personenbezogenen Daten
- Keine Werbung, keine Tracker, keine externen Analysedienste
- Keine Übertragung von Spieldaten
- Speicherung ausschließlich lokal im Browser

## Aufgaben ändern oder ergänzen
Lerninhalte und Spiellogik sind getrennt:
- Inhalte, Fragen und Levelschritte in `js/levels.js`
- Spiellogik, UI, Fortschritt und Bewertung in `js/app.js`

So können Aufgaben einfach angepasst oder erweitert werden, ohne die gesamte Anwendung umzubauen.

## Veröffentlichung über GitHub Pages
Für automatische Veröffentlichung ist ein Workflow enthalten:
- `.github/workflows/pages.yml`
- Deployment bei Push auf `main` oder `master`

**Manueller Schritt (falls noch nicht gesetzt):**
In GitHub unter **Settings → Pages → Build and deployment** als Source **GitHub Actions** auswählen.
