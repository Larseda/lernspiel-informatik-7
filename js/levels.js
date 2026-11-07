window.LEVELS = [
  {
    id: "hardware",
    title: "Level 1: Hardware",
    mascotIntro: "Willkommen im Hardware-Labor! Wir aktivieren die Grundbauteile des Systems.",
    steps: [
      {
        id: "h-intro",
        type: "intro",
        title: "Start",
        description: "Hardware ist alles, was man anfassen kann. Wir prüfen jetzt, wie die Bauteile zusammenarbeiten."
      },
      {
        id: "h-info",
        type: "info",
        title: "Wissen kompakt",
        description: "Prozessor = Gehirn, Netzteil = Herz, RAM = Kurzzeitgedächtnis, Festplatte = Langzeitgedächtnis."
      },
      {
        id: "h-quiz-1",
        type: "quiz",
        title: "Kurzcheck",
        question: "Welches Bauteil entspricht dem Kurzzeitgedächtnis?",
        options: ["Festplattenspeicher", "Arbeitsspeicher (RAM)", "Netzteil", "Mainboard"],
        correctIndex: 1,
        correctFeedback: "Genau! Der RAM ist schnell und speichert Daten nur während der Verarbeitung.",
        hint: "Denke an schnellen, kurzfristigen Speicher."
      },
      {
        id: "h-match-1",
        type: "match",
        title: "Zuordnen",
        prompt: "Ordne die Komponente zur passenden Aufgabe.",
        pairs: [
          { left: "Prozessor", right: "Führt Befehle und Rechenoperationen aus" },
          { left: "Mainboard", right: "Verbindet und hält Komponenten zusammen" },
          { left: "Netzteil", right: "Versorgt den Computer mit Energie" },
          { left: "Netzwerkkarte", right: "Verbindet mit anderen Rechnern" }
        ],
        hint: "Ein Bauteil rechnet, eines liefert Strom, eines verbindet intern, eines verbindet nach außen."
      },
      {
        id: "h-categorize-1",
        type: "categorize",
        title: "Fehlerdiagnose",
        prompt: "Ordne das Symptom der wahrscheinlichsten Hardware-Komponente zu.",
        categories: ["Grafikkarte", "Soundkarte", "Festplattenspeicher"],
        items: [
          { label: "Bild flackert oder bleibt schwarz", category: "Grafikkarte" },
          { label: "Kein Ton über Lautsprecher", category: "Soundkarte" },
          { label: "Dateien werden nicht mehr gespeichert", category: "Festplattenspeicher" }
        ],
        hint: "Bildproblem = Grafik, Tonproblem = Sound, Speicherproblem = Festplatte."
      },
      {
        id: "h-summary",
        type: "summary",
        title: "Levelabschluss",
        description: "Super! Die Hardware-Basis läuft. Der Prozessorkern des Systems ist repariert."
      }
    ]
  },
  {
    id: "eva",
    title: "Level 2: EVA-Prinzip",
    mascotIntro: "Jetzt starten wir die Datenströme. EVA bedeutet Eingabe – Verarbeitung – Ausgabe.",
    steps: [
      {
        id: "e-intro",
        type: "intro",
        title: "Start",
        description: "Bei EVA werden Daten eingegeben, verarbeitet und ausgegeben."
      },
      {
        id: "e-info",
        type: "info",
        title: "Wissen kompakt",
        description: "Während der Verarbeitung tauscht der Computer oft Daten mit dem Speicher aus."
      },
      {
        id: "e-sort-1",
        type: "sort",
        title: "Ablauf ordnen",
        prompt: "Bringe den EVA-Ablauf in die richtige Reihenfolge.",
        items: ["Ausgabe", "Eingabe", "Verarbeitung"],
        expectedOrder: ["Eingabe", "Verarbeitung", "Ausgabe"],
        hint: "Erst Daten hinein, dann bearbeiten, danach Ergebnis anzeigen."
      },
      {
        id: "e-match-1",
        type: "match",
        title: "Geräte zuordnen",
        prompt: "Ordne jedes Gerät zur richtigen EVA-Phase.",
        pairs: [
          { left: "Tastatur", right: "Eingabe" },
          { left: "Rechenoperation im Prozessor", right: "Verarbeitung" },
          { left: "Monitor", right: "Ausgabe" }
        ],
        hint: "Wo kommen Daten hinein, wo werden sie berechnet, wo siehst du das Ergebnis?"
      },
      {
        id: "e-quiz-1",
        type: "quiz",
        title: "Abschlussmission",
        question: "Welche Aussage passt zum EVA-Prinzip?",
        options: [
          "Ausgabe passiert immer vor der Verarbeitung.",
          "Verarbeitung kann mit Speicher austauschen.",
          "Eingabe ist nur mit Maus möglich.",
          "EVA gilt nur für Smartphones."
        ],
        correctIndex: 1,
        correctFeedback: "Richtig! Daten werden häufig während der Verarbeitung aus dem Speicher gelesen oder dorthin geschrieben.",
        hint: "Eine Aussage erwähnt den Speicher richtig."
      },
      {
        id: "e-summary",
        type: "summary",
        title: "Levelabschluss",
        description: "Stark! Das Datenfluss-Modul ist aktiv."
      }
    ]
  },
  {
    id: "bits-bytes",
    title: "Level 3: Bits und Bytes",
    mascotIntro: "Jetzt wird binär gearbeitet: 0 und 1 steuern unsere digitalen Signale.",
    steps: [
      {
        id: "b-intro",
        type: "intro",
        title: "Start",
        description: "Ein Bit ist 0 oder 1. Ein Byte besteht aus acht Bits."
      },
      {
        id: "b-quiz-1",
        type: "quiz",
        title: "Grundlagen",
        question: "Welche Aussage ist korrekt?",
        options: [
          "Ein Byte hat 4 Bits.",
          "Ein Bit ist immer eine Zahl größer als 1.",
          "Ein Byte besteht aus 8 Bits.",
          "ASCII ist ein Betriebssystem."
        ],
        correctIndex: 2,
        correctFeedback: "Perfekt. 8 Bits ergeben 1 Byte.",
        hint: "Die korrekte Zahl für ein Byte ist zentraler Grundbegriff."
      },
      {
        id: "b-bits-1",
        type: "bits",
        title: "Schalteraufgabe",
        prompt: "Stelle das Byte 01000001 ein. (ASCII-Tabelle: A = 01000001, B = 01000010, C = 01000011)",
        targetBits: "01000001",
        hint: "Achte auf die Positionen der Einsen: nur die zweite und letzte Stelle von links sind 1."
      },
      {
        id: "b-fill-1",
        type: "fill",
        title: "Nachricht entschlüsseln",
        prompt: "Welcher Buchstabe passt zu 01000011 laut Tabelle?",
        fields: [
          { id: "buchstabe", label: "Buchstabe", expected: "C" }
        ],
        hint: "Vergleiche mit den Beispielen für A und B in der Tabelle."
      },
      {
        id: "b-summary",
        type: "summary",
        title: "Levelabschluss",
        description: "Sehr gut! Die Binärschnittstelle arbeitet korrekt."
      }
    ]
  },
  {
    id: "dateien-codierung",
    title: "Level 4: Dateien und Codierung",
    mascotIntro: "Dateien speichern Informationen in codierter Form. Wir ordnen den Dateispeicher.",
    steps: [
      {
        id: "d-intro",
        type: "intro",
        title: "Start",
        description: "Dateibezeichnungen bestehen aus Dateiname und Dateiendung."
      },
      {
        id: "d-fill-1",
        type: "fill",
        title: "Dateiname und Endung",
        prompt: "Ergänze für die Datei hund.wav:",
        fields: [
          { id: "name", label: "Dateiname", expected: "hund" },
          { id: "endung", label: "Dateiendung", expected: ".wav" }
        ],
        hint: "Alles vor dem Punkt ist der Name, der Teil mit Punkt ist die Endung."
      },
      {
        id: "d-categorize-1",
        type: "categorize",
        title: "Dateien sortieren",
        prompt: "Ordne die Dateien dem Typ zu.",
        categories: ["Bild", "Audio", "Text"],
        items: [
          { label: "ferienfoto.png", category: "Bild" },
          { label: "notiz.txt", category: "Text" },
          { label: "intro.wav", category: "Audio" }
        ],
        hint: "Achte auf die Dateiendung: .png, .txt, .wav."
      },
      {
        id: "d-match-1",
        type: "match",
        title: "Codierungsarten",
        prompt: "Ordne die Beispiele zur Codierung.",
        pairs: [
          { left: "ASCII", right: "Byte-Zeichen-Zuordnung" },
          { left: "Morsecode", right: "Punkte und Striche" },
          { left: "Blindenschrift", right: "Punktmuster zum Tasten" }
        ],
        hint: "ASCII arbeitet mit Bytes, Morse mit Signalzeichen."
      },
      {
        id: "d-summary",
        type: "summary",
        title: "Levelabschluss",
        description: "Klasse! Das Dateisystem ist wieder geordnet."
      }
    ]
  },
  {
    id: "betriebssystem",
    title: "Level 5: Betriebssystem",
    mascotIntro: "Jetzt starten wir den Systemkern. Das Betriebssystem steuert den ganzen Computer.",
    steps: [
      {
        id: "os-intro",
        type: "intro",
        title: "Start",
        description: "Ein Betriebssystem startet und verwaltet den Computer und führt Programme aus."
      },
      {
        id: "os-quiz-1",
        type: "quiz",
        title: "System oder App?",
        question: "Was ist ein Betriebssystem?",
        options: [
          "Ein einzelnes Spielprogramm",
          "Grundlegende Software zur Verwaltung des Computers",
          "Nur ein Dateiformat",
          "Ein Hardware-Bauteil"
        ],
        correctIndex: 1,
        correctFeedback: "Richtig! Das Betriebssystem ist die grundlegende Steuerungssoftware.",
        hint: "Es ist die Basis, auf der Programme laufen."
      },
      {
        id: "os-categorize-1",
        type: "categorize",
        title: "Aufgaben zuordnen",
        prompt: "Ordne die Aufgabe dem passenden Bereich zu.",
        categories: ["Betriebssystem-Aufgabe", "Anwendungsprogramm-Aufgabe"],
        items: [
          { label: "RAM für Programme zuteilen", category: "Betriebssystem-Aufgabe" },
          { label: "Text in einem Dokument schreiben", category: "Anwendungsprogramm-Aufgabe" },
          { label: "Drucker verwalten", category: "Betriebssystem-Aufgabe" }
        ],
        hint: "Verwalten = meist Betriebssystem, konkrete Arbeit = meist Anwendung."
      },
      {
        id: "os-match-1",
        type: "match",
        title: "Systemfunktionen",
        prompt: "Ordne die Aufgabe zur richtigen OS-Funktion.",
        pairs: [
          { left: "Dateien und Ordner organisieren", right: "Dateiverwaltung" },
          { left: "Tastatur und Maus steuern", right: "Geräteverwaltung" },
          { left: "Programme starten und stoppen", right: "Prozessverwaltung" }
        ],
        hint: "Datei-, Geräte- und Prozessverwaltung heißen genau nach ihrem Arbeitsbereich."
      },
      {
        id: "os-summary",
        type: "summary",
        title: "Levelabschluss",
        description: "Top! Die Systemsteuerung ist online."
      }
    ]
  },
  {
    id: "objekte",
    title: "Level 6: Objekte in der Informatik",
    mascotIntro: "Wir bauen jetzt mit Objekten: konkrete Exemplare mit Attributen und Methoden.",
    steps: [
      {
        id: "o-intro",
        type: "intro",
        title: "Start",
        description: "Objekt = konkreter Bestandteil im Programm. Attribute beschreiben es, Methoden führen Aktionen aus."
      },
      {
        id: "o-quiz-1",
        type: "quiz",
        title: "Begriffe",
        question: "Was ist ein Attributwert?",
        options: [
          "Eine Methode des Objekts",
          "Der konkrete Wert einer Eigenschaft",
          "Der Name der Klasse",
          "Ein Betriebssystembefehl"
        ],
        correctIndex: 1,
        correctFeedback: "Richtig! Beispiel: Attribut Farbe, Attributwert Rot.",
        hint: "Attributwert ist die konkrete Ausprägung einer Eigenschaft."
      },
      {
        id: "o-fill-1",
        type: "fill",
        title: "Objektdiagramm vervollständigen",
        prompt: "Ergänze das Objekt TimsFahrrad mit den passenden Werten.",
        fields: [
          { id: "art", label: "Art", expected: "Rennrad" },
          { id: "farbe", label: "Farbe", expected: "Rot" },
          { id: "gaenge", label: "Anzahl der Gänge", expected: "14" },
          { id: "besitzer", label: "Besitzer", expected: "Tim" }
        ],
        hint: "Nutze die Angaben aus dem bekannten Beispielobjekt."
      },
      {
        id: "o-categorize-1",
        type: "categorize",
        title: "Objekt-Werkstatt",
        prompt: "Ordne die Aussage der richtigen Kategorie zu.",
        categories: ["Objekt", "Attribut", "Methode"],
        items: [
          { label: "TimsFahrrad", category: "Objekt" },
          { label: "Farbe", category: "Attribut" },
          { label: "lackieren()", category: "Methode" }
        ],
        hint: "Objekt = konkretes Exemplar, Attribut = Eigenschaft, Methode = Aktion."
      },
      {
        id: "o-summary",
        type: "summary",
        title: "Levelabschluss",
        description: "Sehr gut! Das Objektmodul läuft stabil."
      }
    ]
  },
  {
    id: "klassen",
    title: "Level 7: Klassen in der Informatik",
    mascotIntro: "Finale! Klassen sind Baupläne, Objekte sind ihre konkreten Exemplare.",
    steps: [
      {
        id: "k-intro",
        type: "intro",
        title: "Start",
        description: "Eine Klasse gibt Attribute und Methoden vor. Ein Objekt entsteht nach diesem Bauplan."
      },
      {
        id: "k-quiz-1",
        type: "quiz",
        title: "Klasse oder Objekt?",
        question: "Welche Aussage stimmt?",
        options: [
          "Objekt und Klasse sind immer dasselbe.",
          "Eine Klasse ist ein konkretes Einzelstück.",
          "Die Klasse ist der Bauplan für Objekte.",
          "Datentypen gehören nicht zu Klassen."
        ],
        correctIndex: 2,
        correctFeedback: "Genau! Klasse = Bauplan, Objekt = konkretes Exemplar.",
        hint: "Denke an Bauplan und fertiges Fahrrad."
      },
      {
        id: "k-match-1",
        type: "match",
        title: "Datentypen zuordnen",
        prompt: "Ordne den Attributen den passenden Datentyp zu.",
        pairs: [
          { left: "anzahlDerGaenge", right: "Zahl" },
          { left: "farbe", right: "Text" },
          { left: "besitzer", right: "Text" }
        ],
        hint: "Anzahl ist numerisch, Namen/Farben sind Text."
      },
      {
        id: "k-fill-1",
        type: "fill",
        title: "Klassendiagramm ergänzen",
        prompt: "Ergänze zwei passende Methoden der Klasse FAHRRAD.",
        fields: [
          { id: "m1", label: "Methode 1", expected: "fahren()" },
          { id: "m2", label: "Methode 2", expected: "reparieren()" }
        ],
        allowAlternatives: {
          m1: ["fahren()", "reparieren()", "anschließen()", "lackieren()"],
          m2: ["fahren()", "reparieren()", "anschließen()", "lackieren()"]
        },
        hint: "Im Fachinhalt stehen vier Methoden zur Auswahl."
      },
      {
        id: "k-quiz-2",
        type: "quiz",
        title: "Abschlussmission",
        question: "Was beschreibt ein Objekt korrekt?",
        options: [
          "Nur der Name einer Klasse ohne Werte",
          "Ein konkretes Exemplar mit Attributwerten",
          "Eine Liste aller Betriebssysteme",
          "Eine Datei ohne Endung"
        ],
        correctIndex: 1,
        correctFeedback: "Richtig! Das Objekt enthält konkrete Werte, die zur Klasse passen.",
        hint: "Ein Objekt ist immer konkret und hat Werte."
      },
      {
        id: "k-summary",
        type: "summary",
        title: "Levelabschluss",
        description: "Fantastisch! Der Bauplan-Kern ist repariert – das Computersystem kann vollständig starten."
      }
    ]
  }
];
