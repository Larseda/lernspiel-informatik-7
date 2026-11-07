window.GAME_LEVELS = [
  {
    id: "hardware",
    title: "1. Hardware-Werkstatt",
    short: "Hardware",
    icon: "🛠️",
    x: 90,
    y: 450,
    objective: "Untersuche den geöffneten PC, finde Bauteile, baue ihn zusammen und behebe vier Hardware-Notfälle.",
    intro: [
      "Willkommen in der Hardware-Werkstatt! Unser Computer ist ausgefallen.",
      "Damit wir ihn reparieren können, müssen wir zuerst seine wichtigsten Bauteile kennenlernen.",
      "Alles am Computer, was du anfassen kannst, nennt man Hardware.",
      "Öffnen wir das Gehäuse und schauen hinein!"
    ]
  },
  {
    id: "eva",
    title: "2. EVA-Kontrollraum",
    short: "EVA",
    icon: "🔄",
    x: 340,
    y: 300,
    objective: "Bringe Eingabe, Verarbeitung, Ausgabe und Speicher wieder in den richtigen Datenfluss.",
    intro: [
      "Hier steuern wir den Datenfluss des Systems.",
      "Daten laufen durch Eingabe, Verarbeitung, Ausgabe und oft auch durch den Speicher.",
      "Ordne den Ablauf korrekt, damit die EVA-Maschine wieder startet."
    ]
  },
  {
    id: "bitbyte",
    title: "3. Bit-und-Byte-Labor",
    short: "Bit & Byte",
    icon: "🧪",
    x: 590,
    y: 180,
    objective: "Schalte Bits, bilde Bytes und entschlüssele eine Nachricht, um die digitale Tür zu öffnen.",
    intro: [
      "Im Labor arbeiten wir mit 0 und 1.",
      "Acht Bits bilden ein Byte und können Zeichen codieren.",
      "Stell die richtigen Muster ein und öffne die Labortür."
    ]
  },
  {
    id: "dateien",
    title: "4. Datei-Archiv",
    short: "Dateien",
    icon: "🗂️",
    x: 860,
    y: 180,
    objective: "Sortiere Dateitypen, markiere Namen/Endungen und repariere das Archivsystem.",
    intro: [
      "Im Archiv ist alles durcheinandergeraten.",
      "Wir trennen Dateiname und Endung, sortieren Dateitypen und prüfen Codierungen.",
      "Am Ende muss das Archiv wieder geordnet laufen."
    ]
  },
  {
    id: "betriebssystem",
    title: "5. Betriebssystem-Zentrale",
    short: "Betriebssystem",
    icon: "🖥️",
    x: 1060,
    y: 250,
    objective: "Aktiviere die richtigen OS-Bereiche bei Störungen und verbinde alle Kernfunktionen.",
    intro: [
      "Hier sitzt die zentrale Steuerung des gesamten Computers.",
      "Bei jeder Störung aktivierst du den passenden Bereich der Zentrale.",
      "Wenn alle Module verbunden sind, läuft das Betriebssystem stabil."
    ]
  },
  {
    id: "objekte",
    title: "6. Objekt-Werkstatt",
    short: "Objekte",
    icon: "🚲",
    x: 1110,
    y: 120,
    objective: "Konfiguriere ein Fahrradobjekt mit Attributen und führe Methoden sichtbar aus.",
    intro: [
      "In der Objekt-Werkstatt bauen wir konkrete Exemplare.",
      "Du änderst Attributwerte direkt am Fahrrad und im Objektdiagramm.",
      "Zum Schluss entsteht das Objekt TimsFahrrad : FAHRRAD."
    ]
  },
  {
    id: "klassen",
    title: "7. Klassen-Konstruktionsraum",
    short: "Klassen",
    icon: "📐",
    x: 760,
    y: 90,
    objective: "Baue ein Klassendiagramm und erzeuge daraus konkrete Fahrradobjekte.",
    intro: [
      "Finale Station: der Klassen-Konstruktionsraum.",
      "Hier baust du den Bauplan FAHRRAD mit Klassenname, Attributen und Methoden.",
      "Danach erzeugen wir konkrete Objekte und fahren das Gesamtsystem hoch."
    ]
  }
];

window.STATION_IDS = window.GAME_LEVELS.map((entry) => entry.id);
