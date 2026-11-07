(function () {
  "use strict";

  const STORAGE_KEY = "systemretter7-adventure-v2";
  const LEVELS = window.GAME_LEVELS || [];
  const STATION_IDS = window.STATION_IDS || LEVELS.map((entry) => entry.id);
  const POINTS_PER_MISSION = 20;

  const state = loadState();
  const ui = getUi();
  const levelRuntimes = {};

  wireUi();
  if (state.started) {
    ui.mascotPanel.classList.remove("hidden");
    if (state.screen === "level" && state.activeLevelId && state.levelStates[state.activeLevelId]) {
      openScreen("level");
    } else {
      openScreen("map");
    }
  } else {
    openScreen("start");
  }

  function getUi() {
    return {
      mascotPanel: $("#mascot-panel"),
      mascotAvatar: $("#mascot-avatar"),
      mascotSpeech: $("#mascot-speech"),
      dialogNextBtn: $("#dialog-next-btn"),
      startScreen: $("#start-screen"),
      mapScreen: $("#map-screen"),
      levelScreen: $("#level-screen"),
      endScreen: $("#end-screen"),
      startMissionBtn: $("#start-mission-btn"),
      stationLayer: $("#station-layer"),
      connectionLayer: $("#connection-layer"),
      mapHero: $("#map-hero"),
      hudLocation: $("#hud-location"),
      hudProgress: $("#hud-progress"),
      hudPoints: $("#hud-points"),
      hudStars: $("#hud-stars"),
      hudCompleted: $("#hud-completed"),
      hudSkipped: $("#hud-skipped"),
      hudLevelStrip: $("#hud-level-strip"),
      levelTitle: $("#level-title"),
      levelObjective: $("#level-objective"),
      levelStage: $("#level-stage"),
      levelFeedback: $("#level-feedback"),
      levelBackMapBtn: $("#level-back-map-btn"),
      skipLevelBtn: $("#skip-level-btn"),
      resetProgressBtn: $("#reset-progress-btn")
    };
  }

  function loadState() {
    const fallback = createDefaultState();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return fallback;
      return migrateState(parsed);
    } catch (error) {
      return fallback;
    }
  }

  function createDefaultState() {
    const levelStates = {};
    STATION_IDS.forEach((id, index) => {
      levelStates[id] = {
        outcome: index === 0 ? "available" : "locked",
        bestPoints: 0,
        bestStars: 0
      };
    });
    return {
      started: false,
      introDone: false,
      screen: "start",
      selectedLevelId: STATION_IDS[0] || null,
      activeLevelId: null,
      avatarIndex: 0,
      levelStates
    };
  }

  function migrateState(existing) {
    const fallback = createDefaultState();
    if (!existing.levelStates || typeof existing.levelStates !== "object") {
      return fallback;
    }
    STATION_IDS.forEach((id, index) => {
      if (!existing.levelStates[id]) existing.levelStates[id] = fallback.levelStates[id];
      const ls = existing.levelStates[id];
      if (!["locked", "available", "current", "completed", "skipped"].includes(ls.outcome)) {
        ls.outcome = index === 0 ? "available" : "locked";
      }
      if (typeof ls.bestPoints !== "number") ls.bestPoints = 0;
      if (typeof ls.bestStars !== "number") ls.bestStars = 0;
    });
    if (!existing.selectedLevelId || !STATION_IDS.includes(existing.selectedLevelId)) {
      existing.selectedLevelId = STATION_IDS[0] || null;
    }
    if (typeof existing.started !== "boolean") existing.started = false;
    if (typeof existing.introDone !== "boolean") existing.introDone = false;
    if (!["start", "map", "level", "end"].includes(existing.screen)) existing.screen = "start";
    if (!Number.isInteger(existing.avatarIndex)) existing.avatarIndex = 0;
    return existing;
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function wireUi() {
    ui.startMissionBtn.addEventListener("click", startMission);
    ui.levelBackMapBtn.addEventListener("click", () => openScreen("map"));
    ui.skipLevelBtn.addEventListener("click", skipActiveLevel);
    ui.resetProgressBtn.addEventListener("click", resetProgress);
  }

  function startMission() {
    state.started = true;
    state.introDone = true;
    ui.mascotPanel.classList.remove("hidden");
    openScreen("map");
    queueDialog([
      "Hallo! Ich bin Byte, dein digitaler Begleiter.",
      "In unserem Computersystem sind mehrere Bereiche ausgefallen.",
      "Gemeinsam bringen wir das System wieder zum Laufen. An jeder Station wartet eine neue Mission auf dich.",
      "Öffne zuerst die Hardware-Werkstatt. Dort starten wir die Reparatur."
    ]);
  }

  function openScreen(screen) {
    state.screen = screen;
    ui.startScreen.classList.toggle("hidden", screen !== "start");
    ui.mapScreen.classList.toggle("hidden", screen !== "map");
    ui.levelScreen.classList.toggle("hidden", screen !== "level");
    if (screen !== "end") {
      ui.endScreen.classList.add("hidden");
    }
    if (screen === "start") {
      ui.mascotPanel.classList.add("hidden");
      setSpeech("Willkommen. Starte die Mission, dann begleite ich dich durch die Computerwelt.");
    } else {
      ui.mascotPanel.classList.remove("hidden");
    }
    if (screen === "map") {
      setSpeech("Auf der Karte siehst du alle sieben Stationen. Gesperrte Bereiche werden nach und nach freigeschaltet.");
    }
    if (screen === "end") {
      renderEndScreen();
    }
    renderAll();
  }

  function renderAll() {
    refreshUnlocks();
    renderHud();
    renderHudStrip();
    renderMap();
    if (state.screen === "level" && state.activeLevelId) renderLevel();
    if (allStationsDone()) {
      state.screen = "end";
      renderEndScreen();
      ui.endScreen.classList.remove("hidden");
      ui.mapScreen.classList.add("hidden");
      ui.levelScreen.classList.add("hidden");
      setSpeech("Fantastisch! Das gesamte Computersystem ist wieder online.");
    }
    saveState();
  }

  function refreshUnlocks() {
    STATION_IDS.forEach((id, index) => {
      const current = state.levelStates[id];
      if (!current) return;
      if (current.outcome === "completed" || current.outcome === "skipped") return;
      if (index === 0) {
        current.outcome = "available";
        return;
      }
      const prevId = STATION_IDS[index - 1];
      const prevOutcome = state.levelStates[prevId].outcome;
      current.outcome = ["completed", "skipped"].includes(prevOutcome) ? "available" : "locked";
    });
    if (state.activeLevelId && state.levelStates[state.activeLevelId]) {
      const active = state.levelStates[state.activeLevelId];
      if (!["completed", "skipped"].includes(active.outcome)) {
        active.outcome = "current";
      }
    }
  }

  function renderHud() {
    const totals = getTotals();
    const currentTitle = state.activeLevelId
      ? getLevel(state.activeLevelId).short
      : state.screen === "map"
        ? "Weltkarte"
        : "Start";
    ui.hudLocation.textContent = currentTitle;
    ui.hudProgress.textContent = `${totals.progressPercent}%`;
    ui.hudPoints.textContent = String(totals.points);
    ui.hudStars.textContent = String(totals.stars);
    ui.hudCompleted.textContent = String(totals.completed);
    ui.hudSkipped.textContent = String(totals.skipped);
  }

  function renderHudStrip() {
    ui.hudLevelStrip.innerHTML = "";
    STATION_IDS.forEach((id, index) => {
      const level = getLevel(id);
      const status = readableStatus(state.levelStates[id].outcome);
      const item = document.createElement("li");
      item.className = state.levelStates[id].outcome;
      const button = document.createElement("button");
      button.type = "button";
      button.disabled = state.levelStates[id].outcome === "locked";
      button.innerHTML = `<strong>${level.icon} ${index + 1}. ${escapeHtml(level.short)}</strong><span class="status">${escapeHtml(status)}</span>`;
      button.addEventListener("click", () => {
        if (button.disabled) return;
        openLevel(id);
      });
      item.appendChild(button);
      ui.hudLevelStrip.appendChild(item);
    });
  }

  function renderMap() {
    ui.stationLayer.innerHTML = "";
    ui.connectionLayer.innerHTML = "";
    STATION_IDS.forEach((id, index) => {
      const level = getLevel(id);
      const status = state.levelStates[id].outcome;
      const group = svg("g");
      group.setAttribute("transform", `translate(${level.x}, ${level.y})`);
      group.setAttribute("tabindex", status === "locked" ? "-1" : "0");
      group.setAttribute("role", "button");
      group.setAttribute("aria-label", `${level.title}, Status: ${readableStatus(status)}`);
      if (status !== "locked") {
        group.addEventListener("click", () => openLevel(id));
        group.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openLevel(id);
          }
        });
      }
      const rect = svg("rect");
      rect.setAttribute("x", "-86");
      rect.setAttribute("y", "-34");
      rect.setAttribute("width", "172");
      rect.setAttribute("height", "68");
      rect.setAttribute("rx", "14");
      rect.setAttribute("class", `station-btn ${status}`);
      const title = svg("text");
      title.setAttribute("y", "-4");
      title.setAttribute("class", "station-label");
      title.textContent = `${level.icon} ${level.short}`;
      const meta = svg("text");
      meta.setAttribute("y", "18");
      meta.setAttribute("class", "station-state");
      meta.textContent = readableStatus(status);
      group.append(rect, title, meta);
      ui.stationLayer.appendChild(group);
      if (index < STATION_IDS.length - 1) {
        const next = getLevel(STATION_IDS[index + 1]);
        const line = svg("line");
        line.setAttribute("x1", String(level.x));
        line.setAttribute("y1", String(level.y));
        line.setAttribute("x2", String(next.x));
        line.setAttribute("y2", String(next.y));
        const active = isStationActivated(index);
        line.setAttribute("stroke", active ? "#4ade80" : "#334155");
        line.setAttribute("stroke-width", active ? "5" : "3");
        line.setAttribute("stroke-dasharray", active ? "0" : "8 7");
        ui.connectionLayer.appendChild(line);
      }
    });
    const heroLevel = getLevel(STATION_IDS[clamp(state.avatarIndex, 0, STATION_IDS.length - 1)]);
    ui.mapHero.style.left = `${heroLevel.x}px`;
    ui.mapHero.style.top = `${heroLevel.y}px`;
  }

  function isStationActivated(index) {
    const id = STATION_IDS[index];
    return ["completed", "skipped"].includes(state.levelStates[id].outcome);
  }

  function openLevel(levelId) {
    const status = state.levelStates[levelId].outcome;
    if (status === "locked") return;
    state.activeLevelId = levelId;
    state.selectedLevelId = levelId;
    if (!levelRuntimes[levelId] || levelRuntimes[levelId].finished) {
      levelRuntimes[levelId] = createRuntime(levelId);
    }
    openScreen("level");
    if (levelId !== "hardware") {
      queueDialog(getLevel(levelId).intro);
    }
    ui.levelStage.focus();
  }

  function createRuntime(levelId) {
    return {
      missionIndex: 0,
      missionPoints: 0,
      missionMistakes: 0,
      hints: 0,
      completed: false,
      finished: false,
      data: {}
    };
  }

  function renderLevel() {
    const level = getLevel(state.activeLevelId);
    if (!level) return;
    ui.levelTitle.textContent = level.title;
    ui.levelObjective.textContent = level.objective;
    clearFeedback();
    renderMissionForLevel(level.id);
  }

  function renderMissionForLevel(levelId) {
    const runtime = levelRuntimes[levelId];
    const missions = LEVEL_RENDERERS[levelId];
    if (!missions) return;
    if (runtime.missionIndex >= missions.length) {
      finishLevel(levelId);
      return;
    }
    missions[runtime.missionIndex]({
      levelId,
      runtime,
      root: ui.levelStage,
      complete: () => {
        runtime.missionIndex += 1;
        if (!runtime.data.usesOwnScoring) {
          runtime.missionPoints += POINTS_PER_MISSION;
        }
        celebrateMascot();
        setFeedback("Mission erfolgreich! Byte hat den Bereich aktiviert.", "ok");
        renderMissionForLevel(levelId);
      },
      mistake: (hint) => {
        runtime.missionMistakes += 1;
        setFeedback(hint, "warn");
      },
      info: (text) => setFeedback(text, "info")
    });
  }

  function finishLevel(levelId) {
    const runtime = levelRuntimes[levelId];
    runtime.completed = true;
    runtime.finished = true;
    const levelState = state.levelStates[levelId];
    const maxPoints = LEVEL_RENDERERS[levelId].length * POINTS_PER_MISSION;
    const penalty = runtime.missionMistakes * 3 + runtime.hints * 2;
    const points = clamp(runtime.missionPoints - penalty, 0, maxPoints);
    const stars = getStars(points, maxPoints);
    levelState.bestPoints = Math.max(levelState.bestPoints, points);
    levelState.bestStars = Math.max(levelState.bestStars, stars);
    levelState.outcome = "completed";
    state.avatarIndex = Math.min(STATION_IDS.indexOf(levelId) + 1, STATION_IDS.length - 1);
    setSpeech("Großartig! Die Station ist repariert. Auf zur nächsten Mission.");
    openScreen("map");
  }

  function skipActiveLevel() {
    if (!state.activeLevelId) return;
    const ok = window.confirm("Dieses Level wird als übersprungen markiert. Du kannst es später nachholen.");
    if (!ok) return;
    const ls = state.levelStates[state.activeLevelId];
    if (ls.outcome !== "completed") ls.outcome = "skipped";
    levelRuntimes[state.activeLevelId] = createRuntime(state.activeLevelId);
    state.avatarIndex = Math.min(STATION_IDS.indexOf(state.activeLevelId) + 1, STATION_IDS.length - 1);
    setSpeech("Kein Problem. Wir markieren die Station als übersprungen und machen weiter.");
    openScreen("map");
  }

  function resetProgress() {
    const ok = window.confirm("Möchtest du den gesamten Lernfortschritt wirklich zurücksetzen?");
    if (!ok) return;
    const fresh = createDefaultState();
    Object.assign(state, fresh);
    STATION_IDS.forEach((id) => {
      delete levelRuntimes[id];
    });
    openScreen("start");
  }

  function renderEndScreen() {
    const totals = getTotals();
    const skipped = STATION_IDS.filter((id) => state.levelStates[id].outcome === "skipped");
    ui.endScreen.innerHTML = `
      <h2>System vollständig reaktiviert</h2>
      <p>Alle Stationen wurden aktiviert. Das Computersystem läuft wieder stabil.</p>
      <p><strong>Fortschritt:</strong> ${totals.progressPercent}% | <strong>Punkte:</strong> ${totals.points} | <strong>Sterne:</strong> ${totals.stars}</p>
      <p><strong>Abgeschlossen:</strong> ${totals.completed} | <strong>Übersprungen:</strong> ${totals.skipped}</p>
      ${skipped.length ? `<p>Übersprungene Stationen: ${skipped.map((id) => getLevel(id).short).join(", ")}</p>` : "<p>Alle sieben Stationen wurden erfolgreich abgeschlossen.</p>"}
      <span class="final-badge" aria-label="Digitales Abzeichen">🏅 Abzeichen: Systemretter*in Klasse 7</span>
      <div class="taskbar">
        <button type="button" id="end-to-map" class="secondary-btn">Zur Weltkarte</button>
        <button type="button" id="end-reset" class="danger-btn">Fortschritt zurücksetzen</button>
      </div>
    `;
    const toMap = $("#end-to-map");
    const reset = $("#end-reset");
    if (toMap) toMap.addEventListener("click", () => openScreen("map"));
    if (reset) reset.addEventListener("click", resetProgress);
  }

  function getTotals() {
    let completed = 0;
    let skipped = 0;
    let points = 0;
    let stars = 0;
    STATION_IDS.forEach((id) => {
      const ls = state.levelStates[id];
      if (ls.outcome === "completed") completed += 1;
      if (ls.outcome === "skipped") skipped += 1;
      points += ls.bestPoints;
      stars += ls.bestStars;
    });
    return {
      completed,
      skipped,
      points,
      stars,
      progressPercent: Math.round(((completed + skipped) / STATION_IDS.length) * 100)
    };
  }

  function allStationsDone() {
    return STATION_IDS.every((id) => ["completed", "skipped"].includes(state.levelStates[id].outcome));
  }

  function getStars(points, max) {
    if (!max || points <= 0) return 0;
    const ratio = points / max;
    if (ratio >= 0.88) return 3;
    if (ratio >= 0.64) return 2;
    return 1;
  }

  function setFeedback(text, tone) {
    ui.levelFeedback.textContent = text;
    ui.levelFeedback.className = `level-feedback feedback-${tone || "info"}`;
  }

  function clearFeedback() {
    setFeedback("", "info");
  }

  function queueDialog(lines, onDone) {
    if (!Array.isArray(lines) || lines.length === 0) return;
    let index = 0;
    setSpeech(lines[index]);
    ui.dialogNextBtn.classList.remove("hidden");
    ui.dialogNextBtn.onclick = () => {
      index += 1;
      if (index >= lines.length) {
        ui.dialogNextBtn.classList.add("hidden");
        ui.dialogNextBtn.onclick = null;
        if (typeof onDone === "function") onDone();
        return;
      }
      setSpeech(lines[index]);
    };
  }

  function setSpeech(text) {
    ui.mascotSpeech.textContent = text || "";
  }

  function setByteState(stateName) {
    ui.mascotAvatar.dataset.state = stateName || "neutral";
  }

  function celebrateMascot() {
    ui.mascotAvatar.classList.remove("celebrate");
    ui.mascotAvatar.offsetWidth;
    ui.mascotAvatar.classList.add("celebrate");
  }

  function readableStatus(outcome) {
    if (outcome === "locked") return "🔒 Gesperrt";
    if (outcome === "available") return "🟦 Verfügbar";
    if (outcome === "current") return "▶ Aktuell";
    if (outcome === "completed") return "✅ Abgeschlossen";
    if (outcome === "skipped") return "⏭ Übersprungen";
    return "–";
  }

  function getLevel(levelId) {
    return LEVELS.find((entry) => entry.id === levelId);
  }

  function svg(name) {
    return document.createElementNS("http://www.w3.org/2000/svg", name);
  }

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function normalize(value) {
    return String(value || "").trim().toLowerCase().replaceAll(/\s+/g, " ");
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function $(selector) {
    return document.querySelector(selector);
  }

  function createMissionTitle(title, subtitle) {
    return `<div class="panel"><h3>${escapeHtml(title)}</h3><p>${escapeHtml(subtitle)}</p></div>`;
  }

  function appendTaskbar(root, actions) {
    const bar = document.createElement("div");
    bar.className = "taskbar";
    actions.forEach((action) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = action.label;
      if (action.secondary) button.className = "secondary-btn";
      button.addEventListener("click", action.onClick);
      bar.appendChild(button);
    });
    root.appendChild(bar);
    return bar;
  }

  function setupPlaceInteraction(parts, slots, runtimeData, onRight, onWrong) {
    runtimeData.selectedPart = null;
    parts.forEach((part) => {
      part.addEventListener("click", () => {
        runtimeData.selectedPart = part.dataset.part;
        parts.forEach((node) => node.classList.toggle("selected", node === part));
      });
      part.addEventListener("dragstart", (event) => {
        runtimeData.selectedPart = part.dataset.part;
        event.dataTransfer.setData("text/plain", part.dataset.part);
      });
    });
    slots.forEach((slot) => {
      slot.addEventListener("dragover", (event) => event.preventDefault());
      slot.addEventListener("drop", (event) => {
        event.preventDefault();
        const fromDrag = event.dataTransfer.getData("text/plain");
        const selected = fromDrag || runtimeData.selectedPart;
        placePart(selected, slot);
      });
      slot.addEventListener("click", () => {
        placePart(runtimeData.selectedPart, slot);
      });
    });

    function placePart(selected, slot) {
      if (!selected) return;
      const hasFixedAccept = Boolean(slot.dataset.accept);
      if (hasFixedAccept && slot.dataset.filled === "1") return;
      if (hasFixedAccept && slot.dataset.accept !== selected) {
        onWrong(selected, slot);
        return;
      }
      if (hasFixedAccept) {
        slot.dataset.filled = "1";
        slot.classList.add("correct");
        slot.textContent = selected;
      }
      onRight(selected, slot);
    }
  }

  const HARDWARE_MAX_POINTS = 330;
  const HARDWARE_COMPONENTS = [
    {
      id: "mainboard",
      name: "Mainboard",
      slotName: "Mainboard",
      task: "Das Mainboard ist die große Platine im Computer. Es hält die Komponenten zusammen und verbindet sie miteinander.",
      comparison: "Beim Menschen kann man es mit dem Skelett und den Nervenbahnen vergleichen.",
      searchPrompt: "Klicke auf das Mainboard.",
      searchHint: "Suche die große Platine in der Mitte des Gehäuses.",
      searchHintStrong: "Die richtige Region ist groß und liegt unter vielen Steckplätzen.",
      success: "Richtig! Das ist das Mainboard.",
      functionText: "Hält die Komponenten zusammen und verbindet sie miteinander.",
      comparisonName: "Skelett und Nervenbahnen",
      comparisonExplain: "Das Mainboard hält und verbindet die Bauteile, ähnlich wie Skelett und Nervenbahnen."
    },
    {
      id: "cpu",
      name: "Prozessor",
      slotName: "Prozessorsockel",
      task: "Der Prozessor führt Rechenoperationen und Befehle aus. Er verarbeitet die Anweisungen der Programme.",
      comparison: "Er wird deshalb häufig mit dem Gehirn verglichen.",
      searchPrompt: "Finde den Prozessor.",
      searchHint: "Der Prozessor ist ein kleiner quadratischer Chip auf dem Mainboard.",
      searchHintStrong: "Achte auf den quadratischen Sockelbereich im oberen Mainboard-Bereich.",
      success: "Richtig! Das ist der Prozessor.",
      functionText: "Führt Rechenoperationen und Befehle aus.",
      comparisonName: "Gehirn",
      comparisonExplain: "Der Prozessor verarbeitet Befehle, ähnlich wie das Gehirn Informationen verarbeitet."
    },
    {
      id: "ram",
      name: "Arbeitsspeicher",
      slotName: "RAM-Steckplätze",
      task: "Der Arbeitsspeicher speichert Daten, die der Computer gerade benötigt. Auf diese Daten kann er besonders schnell zugreifen.",
      comparison: "Er funktioniert ähnlich wie unser Kurzzeitgedächtnis.",
      searchPrompt: "Wo befindet sich der Arbeitsspeicher?",
      searchHint: "Suche nach länglichen Modulen direkt neben dem Prozessor.",
      searchHintStrong: "Die richtige Region sind zwei schmale, lange Steckplätze neben dem Chip.",
      success: "Genau, hier steckt der Arbeitsspeicher.",
      functionText: "Speichert Daten, die gerade verarbeitet werden.",
      comparisonName: "Kurzzeitgedächtnis",
      comparisonExplain: "Der Arbeitsspeicher hält gerade benötigte Daten bereit, ähnlich wie das Kurzzeitgedächtnis."
    },
    {
      id: "storage",
      name: "Festplattenspeicher",
      slotName: "Laufwerksbereich",
      task: "Der Festplattenspeicher bewahrt Daten langfristig auf, auch wenn der Computer ausgeschaltet wird.",
      comparison: "Er kann mit dem Langzeitgedächtnis verglichen werden.",
      searchPrompt: "Klicke auf den Festplattenspeicher.",
      searchHint: "Suche den Laufwerksbereich im rechten unteren Gehäusebereich.",
      searchHintStrong: "Die richtige Region sieht wie ein Laufwerk/SSD-Bereich aus.",
      success: "Richtig! Das ist der Festplattenspeicher.",
      functionText: "Speichert Daten langfristig.",
      comparisonName: "Langzeitgedächtnis",
      comparisonExplain: "Der Festplattenspeicher bewahrt Daten dauerhaft auf, ähnlich wie das Langzeitgedächtnis."
    },
    {
      id: "psu",
      name: "Netzteil",
      slotName: "Netzteilbereich",
      task: "Das Netzteil versorgt alle Komponenten mit elektrischer Energie.",
      comparison: "Es ähnelt dem Herz, weil es die notwendige Energie im System verteilt.",
      searchPrompt: "Wo befindet sich das Netzteil?",
      searchHint: "Das Netzteil ist ein größerer Kasten am Rand des Gehäuses.",
      searchHintStrong: "Suche den großen Block mit Lüftergitter in einer Gehäuseecke.",
      success: "Richtig! Das Netzteil versorgt den Computer mit Energie.",
      functionText: "Versorgt den Computer mit Energie.",
      comparisonName: "Herz",
      comparisonExplain: "Das Netzteil verteilt Energie im Computer, ähnlich wie das Herz im Körper."
    },
    {
      id: "gpu",
      name: "Grafikkarte",
      slotName: "Grafikkarten-Steckplatz",
      task: "Die Grafikkarte verarbeitet grafische Daten und bereitet Bilder für den Monitor vor.",
      comparison: "Sie wird mit dem Sehsinn verglichen, nicht einfach mit dem Auge.",
      searchPrompt: "Finde die Grafikkarte.",
      searchHint: "Die Grafikkarte ist eine lange Steckkarte und besitzt einen eigenen Lüfter.",
      searchHintStrong: "Die richtige Region ist eine lange Karte im großen Erweiterungssteckplatz.",
      success: "Richtig! Das ist die Grafikkarte.",
      functionText: "Verarbeitet grafische Daten für die Bildausgabe.",
      comparisonName: "Sehsinn",
      comparisonExplain: "Die Grafikkarte bereitet visuelle Informationen auf, ähnlich wie der Sehsinn."
    },
    {
      id: "sound",
      name: "Soundkarte",
      slotName: "Soundkarten-Steckplatz",
      task: "Die Soundkarte verarbeitet Audiodaten für Lautsprecher und Mikrofon.",
      comparison: "Sie kann mit dem Hörsinn verglichen werden.",
      searchPrompt: "Klicke auf die Soundkarte.",
      searchHint: "Die Soundkarte ist eine kleinere Steckkarte unter der Grafikkarte.",
      searchHintStrong: "Suche die kleine Karte nahe den Audio-Anschlüssen.",
      success: "Richtig! Das ist die Soundkarte.",
      functionText: "Verarbeitet Audiodaten für Lautsprecher und Mikrofon.",
      comparisonName: "Hörsinn",
      comparisonExplain: "Die Soundkarte verarbeitet Toninformationen, ähnlich wie der Hörsinn."
    },
    {
      id: "network",
      name: "Netzwerkkarte",
      slotName: "Netzwerkkarten-Steckplatz",
      task: "Die Netzwerkkarte verbindet den Computer mit anderen Computern und Netzwerken.",
      comparison: "",
      searchPrompt: "Wo befindet sich die Netzwerkkarte?",
      searchHint: "Die Netzwerkkarte sitzt in einem Erweiterungssteckplatz mit Netzwerkanschluss.",
      searchHintStrong: "Suche die Steckkarte mit RJ45-Port in Richtung Gehäuserückseite.",
      success: "Richtig! Das ist die Netzwerkkarte.",
      functionText: "Verbindet den Computer mit anderen Computern und Netzwerken."
    }
  ];

  const HARDWARE_DISCOVERY_ORDER = ["mainboard", "cpu", "ram", "storage", "psu", "gpu", "sound", "network"];

  function startHardwareLevel({ root, runtime, complete }) {
    const hw = getHardwareState(runtime);
    setByteState("neutral");
    root.innerHTML = `
      ${createMissionTitle("Szene 1: Ankunft in der Hardware-Werkstatt", "Untersuche die Werkstatt und öffne anschließend den Computer.")}
      <div class="hw-scene panel">
        <div class="hw-workshop closed" id="hw-workshop">
          <div class="hw-alert-line"></div>
          <div class="hw-alert-line alt"></div>
          <div class="hw-closed-case">
            <div class="hw-case-monitor off">OFFLINE</div>
          </div>
        </div>
        <div class="taskbar">
          <button type="button" id="hw-open-case" class="primary-btn" disabled>Computer untersuchen</button>
        </div>
      </div>
    `;
    queueDialog([
      "Willkommen in der Hardware-Werkstatt! Unser Computer ist ausgefallen.",
      "Damit wir ihn reparieren können, müssen wir zuerst seine wichtigsten Bauteile kennenlernen.",
      "Alles am Computer, was du anfassen kannst, nennt man Hardware.",
      "Öffnen wir das Gehäuse und schauen hinein!"
    ], () => {
      $("#hw-open-case").disabled = false;
      setByteState("repair");
      setSpeech("Bereit? Starte mit „Computer untersuchen“.");
    });
    $("#hw-open-case").addEventListener("click", () => {
      const workshop = $("#hw-workshop");
      workshop.classList.remove("closed");
      workshop.classList.add("opening");
      setByteState("repair");
      setFeedback("Das Gehäuse öffnet sich.", "info");
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      setTimeout(() => {
        hw.labelsVisible = [];
        complete();
      }, reduced ? 50 : 450);
    });
  }

  function showComponentDiscovery({ root, runtime, complete }) {
    const hw = getHardwareState(runtime);
    const index = hw.discoveryIndex || 0;
    const componentId = HARDWARE_DISCOVERY_ORDER[index];
    if (!componentId) {
      setByteState("success");
      setSpeech("Jetzt kennst du die wichtigsten Teile. Mal sehen, ob du sie im Computer wiederfindest!");
      root.innerHTML = `
        ${createMissionTitle("Szene 2: Bauteile entdecken", "Alle wichtigen Komponenten wurden vorgestellt.")}
        ${renderHardwarePcSvg({ labels: hw.labelsVisible, mode: "open" })}
        <div class="taskbar"><button type="button" id="hw-start-search">Suchmission starten</button></div>
      `;
      $("#hw-start-search").addEventListener("click", complete);
      return;
    }
    const comp = getHardwareComponent(componentId);
    const discovered = new Set(hw.labelsVisible || []);
    discovered.add(componentId);
    hw.labelsVisible = [...discovered];
    setByteState("neutral");
    setSpeech(comp.task);
    root.innerHTML = `
      ${createMissionTitle("Szene 2: Bauteile entdecken", `Bauteil ${index + 1}/8: ${comp.name}`)}
      ${renderHardwarePcSvg({ labels: hw.labelsVisible, mode: "open", highlight: componentId, dimOthers: true, pulse: componentId })}
      <div class="panel hw-info-box">
        <p><strong>${comp.name}</strong></p>
        <p>${comp.task}</p>
        ${comp.comparison ? `<p>${comp.comparison}</p>` : "<p>Für diese Komponente gibt es hier keinen verbindlichen menschlichen Vergleich.</p>"}
      </div>
      <div class="taskbar"><button type="button" id="hw-discovery-next">Weiter</button></div>
    `;
    $("#hw-discovery-next").addEventListener("click", () => {
      hw.discoveryIndex = index + 1;
      showComponentDiscovery({ root, runtime, complete });
    });
  }

  function startComponentSearch({ root, runtime, complete }) {
    const hw = getHardwareState(runtime);
    if (!hw.searchOrder) {
      hw.searchOrder = shuffle([...HARDWARE_DISCOVERY_ORDER]);
      hw.searchIndex = 0;
      hw.searchAttempts = {};
      hw.searchSolved = [];
    }
    if (hw.searchIndex >= hw.searchOrder.length) {
      setByteState("success");
      setSpeech("Sehr gut! Du findest dich schon im Inneren des Computers zurecht.");
      root.innerHTML = `
        ${createMissionTitle("Szene 3: Bauteile im Computer finden", "Alle Suchaufträge erledigt.")}
        ${renderHardwarePcSvg({ labels: hw.labelsVisible, mode: "open", solved: hw.searchSolved })}
        <div class="taskbar"><button type="button" id="hw-search-finish">Weiter zum Zusammenbau</button></div>
      `;
      $("#hw-search-finish").addEventListener("click", complete);
      return;
    }
    const targetId = hw.searchOrder[hw.searchIndex];
    const target = getHardwareComponent(targetId);
    const attempts = hw.searchAttempts[targetId] || 0;
    setByteState("neutral");
    if (hw.pendingHintMessage) {
      setSpeech(hw.pendingHintMessage);
      hw.pendingHintMessage = "";
    } else {
      setSpeech(target.searchPrompt);
    }
    root.innerHTML = `
      ${createMissionTitle("Szene 3: Bauteile im Computer finden", `Suchauftrag ${hw.searchIndex + 1}/8: ${target.searchPrompt}`)}
      ${renderHardwarePcSvg({ labels: hw.labelsVisible, mode: "open", solved: hw.searchSolved, focusTarget: attempts >= 2 ? targetId : "" })}
      <p><strong>Punkte in diesem Auftrag:</strong> erster Versuch 10 | zweiter Versuch 7 | danach 5</p>
    `;
    wireHardwareComponentButtons(root, (clickedId, button) => {
      if (clickedId === targetId) {
        const tryCount = hw.searchAttempts[targetId] || 0;
        const points = tryCount === 0 ? 10 : (tryCount === 1 ? 7 : 5);
        addHardwarePoints(runtime, `search-${targetId}`, points);
        if (!hw.searchSolved.includes(targetId)) hw.searchSolved.push(targetId);
        hw.searchIndex += 1;
        setByteState("success");
        setSpeech(target.success);
        setFeedback(`${target.success} +${points} Punkte`, "ok");
        startComponentSearch({ root, runtime, complete });
        return;
      }
      hw.searchAttempts[targetId] = (hw.searchAttempts[targetId] || 0) + 1;
      hw.totalAttempts += 1;
      button.classList.add("hw-wrong");
      setTimeout(() => button.classList.remove("hw-wrong"), 450);
      if (hw.searchAttempts[targetId] === 1) {
        hw.hintsUsed += 1;
        setByteState("hint");
        setSpeech(target.searchHint);
        setFeedback(target.searchHint, "warn");
      } else {
        hw.hintsUsed += 1;
        setByteState("hint");
        hw.pendingHintMessage = target.searchHintStrong;
        setFeedback("Die richtige Einbauregion pulsiert leicht. Klicke sie jetzt an.", "warn");
        startComponentSearch({ root, runtime, complete });
      }
    });
  }

  function startComputerAssembly({ root, runtime, complete }) {
    const hw = getHardwareState(runtime);
    const parts = [
      { id: "cpu", name: "Prozessor" },
      { id: "ram", name: "Arbeitsspeicher (2 Module)" },
      { id: "storage", name: "Festplattenspeicher" },
      { id: "psu", name: "Netzteil" },
      { id: "gpu", name: "Grafikkarte" },
      { id: "sound", name: "Soundkarte" },
      { id: "network", name: "Netzwerkkarte" }
    ];
    if (!hw.assemblyPlaced) hw.assemblyPlaced = {};
    const leftParts = parts.filter((part) => !hw.assemblyPlaced[part.id]);
    root.innerHTML = `
      ${createMissionTitle("Szene 4: Computer zusammenbauen", "Setze alle sieben Bauteile ein. Drag-and-drop oder Anklicken + Ziel anklicken.")}
      <div class="mission-grid">
        <div class="panel">
          ${renderHardwarePcSvg({ labels: hw.labelsVisible, mode: "assembly", placed: hw.assemblyPlaced })}
          <p>Aktivierte Leitungen: ${Object.keys(hw.assemblyPlaced).length}/7</p>
        </div>
        <div class="parts-bank panel" id="hw-assembly-bank">
          ${leftParts.map((part) => `<button type="button" class="part-card hw-assembly-part" draggable="true" data-part="${part.id}">${part.name}</button>`).join("")}
          ${leftParts.length === 0 ? "<p>Alle Bauteile eingebaut.</p>" : ""}
        </div>
      </div>
      <div class="taskbar">
        <span><strong>Ausgewählt:</strong> <span id="hw-selected-part">${hw.selectedAssembly || "–"}</span></span>
      </div>
    `;
    if (!leftParts.length) {
      setByteState("success");
      setSpeech("Alle Teile sind eingebaut. Jetzt müssen wir noch prüfen, welche Aufgaben sie übernehmen.");
      const nextButton = document.createElement("button");
      nextButton.type = "button";
      nextButton.textContent = "Weiter zur Funktionsprüfung";
      nextButton.addEventListener("click", complete);
      root.appendChild(nextButton);
      return;
    }
    const partNodes = [...root.querySelectorAll(".hw-assembly-part")];
    const slotNodes = [...root.querySelectorAll(".hw-slot-btn")];
    partNodes.forEach((node) => {
      node.addEventListener("click", () => {
        hw.selectedAssembly = node.dataset.part;
        $("#hw-selected-part").textContent = getHardwareComponent(hw.selectedAssembly).name;
        partNodes.forEach((entry) => entry.classList.toggle("selected", entry === node));
      });
      node.addEventListener("dragstart", (event) => {
        hw.selectedAssembly = node.dataset.part;
        event.dataTransfer.setData("text/plain", node.dataset.part);
      });
    });
    slotNodes.forEach((slot) => {
      slot.addEventListener("dragover", (event) => event.preventDefault());
      slot.addEventListener("drop", (event) => {
        event.preventDefault();
        const selected = event.dataTransfer.getData("text/plain") || hw.selectedAssembly;
        tryPlaceAssemblyPart(selected, slot.dataset.slot);
      });
      slot.addEventListener("click", () => {
        tryPlaceAssemblyPart(hw.selectedAssembly, slot.dataset.slot);
      });
      slot.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          tryPlaceAssemblyPart(hw.selectedAssembly, slot.dataset.slot);
        }
      });
    });

    function tryPlaceAssemblyPart(selectedPart, slotId) {
      if (!selectedPart || hw.assemblyPlaced[slotId]) return;
      if (selectedPart === slotId) {
        hw.assemblyPlaced[slotId] = true;
        addHardwarePoints(runtime, `assembly-${slotId}`, 10);
        setByteState("repair");
        setSpeech(`${getHardwareComponent(slotId).name}: ${getHardwareComponent(slotId).functionText}`);
        setFeedback("Bauteil rastet ein und Leitung wird aktiviert. +10 Punkte", "ok");
        hw.selectedAssembly = null;
        startComputerAssembly({ root, runtime, complete });
      } else {
        hw.totalAttempts += 1;
        setByteState("hint");
        setSpeech(getAssemblyHint(slotId));
        setFeedback("Dieses Bauteil passt dort nicht. Versuche es erneut.", "warn");
        const targetSlot = root.querySelector(`.hw-slot-btn[data-slot="${slotId}"]`);
        if (targetSlot) {
          targetSlot.classList.add("hw-wrong");
          setTimeout(() => targetSlot.classList.remove("hw-wrong"), 450);
        }
      }
    }
  }

  function startFunctionAndComparison({ root, runtime, complete }) {
    const hw = getHardwareState(runtime);
    if (!hw.functionRound) hw.functionRound = 1;
    if (!hw.functionLinks) hw.functionLinks = {};
    if (!hw.humanLinks) hw.humanLinks = {};

    if (hw.functionRound <= 2) {
      const rounds = [
        ["cpu", "psu", "ram", "storage"],
        ["gpu", "sound", "mainboard", "network"]
      ];
      const ids = rounds[hw.functionRound - 1];
      renderConnectionRound({
        root,
        title: `Szene 5A: Funktionen verbinden – Runde ${hw.functionRound}/2`,
        subtitle: "Verbinde Hardwarekomponenten mit ihren Aufgaben.",
        leftItems: ids.map((id) => ({ id, label: getHardwareComponent(id).name, icon: getHardwareIcon(id) })),
        rightItems: shuffle(ids.map((id) => ({ id, label: getHardwareComponent(id).functionText }))),
        links: hw.functionLinks,
        onSuccess: (id) => {
          addHardwarePoints(runtime, `func-${id}`, 8);
          setByteState("success");
          setSpeech(`Richtig verbunden: ${getHardwareComponent(id).name}.`);
        },
        onMistake: (leftId) => {
          hw.totalAttempts += 1;
          hw.hintsUsed += 1;
          setByteState("hint");
          setSpeech(`${getHardwareComponent(leftId).name}: ${getHardwareComponent(leftId).functionText}`);
        },
        onRoundDone: () => {
          if (hw.functionRound === 1) {
            hw.functionRound = 2;
            startFunctionAndComparison({ root, runtime, complete });
          } else {
            hw.functionRound = 3;
            startFunctionAndComparison({ root, runtime, complete });
          }
        }
      });
      return;
    }

    const ids = ["cpu", "psu", "ram", "storage", "gpu", "sound", "mainboard"];
    renderConnectionRound({
      root,
      title: "Szene 5B: Mensch und Computer",
      subtitle: "Verbinde die Komponenten mit den passenden menschlichen Vergleichen.",
      leftItems: ids.map((id) => ({ id, label: getHardwareComponent(id).name, icon: getHardwareIcon(id) })),
      rightItems: shuffle(ids.map((id) => ({ id, label: getHardwareComponent(id).comparisonName }))),
      links: hw.humanLinks,
      onSuccess: (id) => {
        addHardwarePoints(runtime, `human-${id}`, 8);
        setByteState("success");
        setSpeech(getHardwareComponent(id).comparisonExplain);
      },
      onMistake: (leftId) => {
        hw.totalAttempts += 1;
        hw.hintsUsed += 1;
        setByteState("hint");
        setSpeech(`Hinweis: ${getHardwareComponent(leftId).comparison}`);
      },
      onRoundDone: () => {
        complete();
      }
    });
  }

  function startRepairMission({ root, runtime }) {
    const hw = getHardwareState(runtime);
    if (!hw.repairCases) {
      hw.repairCases = [
        {
          title: "FALL 1: KEIN STROM",
          prompt: "Der Computer bekommt keine Energie. Welches Bauteil sollten wir überprüfen?",
          component: "psu",
          success: "Richtig! Das Netzteil versorgt die Komponenten mit Energie."
        },
        {
          title: "FALL 2: KEIN BILD",
          prompt: "Der Computer läuft, aber auf dem Monitor erscheint kein Bild. Welches Bauteil verarbeitet die grafischen Daten?",
          component: "gpu",
          success: "Genau! Die Grafikkarte verarbeitet die Daten für die Bildausgabe."
        },
        {
          title: "FALL 3: KEINE NETZWERKVERBINDUNG",
          prompt: "Der Computer kann keine Verbindung zu anderen Computern herstellen. Welches Bauteil ist dafür zuständig?",
          component: "network",
          success: "Richtig! Die Netzwerkkarte verbindet den Computer mit anderen Computern und Netzwerken."
        },
        {
          title: "FALL 4: DATEN FÜR LAUFENDE PROGRAMME",
          prompt: "Der Computer benötigt einen schnellen Speicher für Daten, die gerade verarbeitet werden. Welches Bauteil brauchen wir?",
          component: "ram",
          success: "Genau! Der Arbeitsspeicher hält aktuell benötigte Daten schnell bereit."
        }
      ];
      hw.repairIndex = 0;
      hw.repairSolved = {};
      hw.repairState = {
        power: false,
        monitor: false,
        network: false,
        dataFlow: false,
        systemOnline: false
      };
    }

    if (hw.levelCompleted) {
      renderHardwareSummary(root, runtime);
      return;
    }

    const active = hw.repairCases[hw.repairIndex];
    setByteState("repair");
    setSpeech("Alle Teile sind eingebaut. Aber mehrere Fehler verhindern den Start. Untersuche den Computer und repariere die Störungen!");
    root.innerHTML = `
      ${createMissionTitle("Szene 6: Notfall in der Hardware-Werkstatt", active ? `${active.title} – ${active.prompt}` : "Abschlusssequenz")}
      <div class="panel">
        ${renderHardwarePcSvg({
          labels: HARDWARE_COMPONENTS.map((entry) => entry.id),
          mode: "repair",
          solved: Object.keys(hw.repairSolved),
          status: hw.repairState
        })}
        <div class="hw-repair-status">
          <span>${hw.repairState.power ? "🟢 Strom aktiv" : "🔴 Stromausfall"}</span>
          <span>${hw.repairState.monitor ? "🟢 Monitor aktiv" : "🔴 Kein Bild"}</span>
          <span>${hw.repairState.network ? "🟢 Netzwerk aktiv" : "🔴 Netzwerk getrennt"}</span>
          <span>${hw.repairState.dataFlow ? "🟢 Datentransfer aktiv" : "🔴 Datenstau"}</span>
        </div>
      </div>
    `;
    wireHardwareComponentButtons(root, (clickedId, button) => {
      if (!active) return;
      if (clickedId === active.component) {
        hw.repairSolved[active.title] = true;
        addHardwarePoints(runtime, `repair-${active.component}`, 15);
        applyRepairState(hw.repairState, active.component);
        setByteState("success");
        setSpeech(active.success);
        setFeedback(`${active.success} +15 Punkte`, "ok");
        hw.repairIndex += 1;
        if (hw.repairIndex >= hw.repairCases.length) {
          runHardwarePowerOnSequence(root, runtime);
        } else {
          startRepairMission({ root, runtime });
        }
      } else {
        hw.totalAttempts += 1;
        hw.hintsUsed += 1;
        setByteState("hint");
        setSpeech(getHardwareComponent(active.component).searchHint);
        setFeedback("Das passt nicht zum aktuellen Notfall. Prüfe den Hinweis von Byte.", "warn");
        button.classList.add("hw-wrong");
        setTimeout(() => button.classList.remove("hw-wrong"), 450);
      }
    });
  }

  function runHardwarePowerOnSequence(root, runtime) {
    const hw = getHardwareState(runtime);
    hw.repairState.power = true;
    hw.repairState.monitor = true;
    hw.repairState.network = true;
    hw.repairState.dataFlow = true;
    hw.repairState.systemOnline = true;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setByteState("celebrate");
    setSpeech("Geschafft! Der Computer läuft wieder.");
    setFeedback("Netzteil startet, Leitungen leuchten, Lüfter drehen und der Monitor zeigt SYSTEM ONLINE.", "ok");
    hw.levelCompleted = true;
    completeHardwareLevel(runtime);
    setTimeout(() => renderHardwareSummary(root, runtime), reduced ? 20 : 700);
  }

  function completeHardwareLevel(runtime) {
    const hw = getHardwareState(runtime);
    const points = hw.points;
    const stars = getHardwareStars(points, HARDWARE_MAX_POINTS);
    const levelId = "hardware";
    const levelState = state.levelStates[levelId];
    levelState.bestPoints = Math.max(levelState.bestPoints, points);
    levelState.bestStars = Math.max(levelState.bestStars, stars);
    levelState.outcome = "completed";
    state.avatarIndex = Math.min(STATION_IDS.indexOf(levelId) + 1, STATION_IDS.length - 1);
    runtime.finished = true;
  }

  function renderHardwareSummary(root, runtime) {
    const hw = getHardwareState(runtime);
    const points = hw.points;
    const stars = getHardwareStars(points, HARDWARE_MAX_POINTS);
    root.innerHTML = `
      ${createMissionTitle("Levelabschluss: Hardware-Werkstatt", "SYSTEM ONLINE")}
      <div class="panel">
        ${renderHardwarePcSvg({
          labels: HARDWARE_COMPONENTS.map((entry) => entry.id),
          mode: "repair",
          solved: HARDWARE_COMPONENTS.map((entry) => entry.id),
          status: { power: true, monitor: true, network: true, dataFlow: true, systemOnline: true }
        })}
      </div>
      <div class="panel">
        <p>Du kannst die wichtigsten Hardwarekomponenten erkennen und ihre Aufgaben erklären.</p>
        <ul>
          <li>Prozessor: Befehle und Berechnungen</li>
          <li>Netzteil: Energie</li>
          <li>Arbeitsspeicher: aktuelle Daten</li>
          <li>Festplattenspeicher: langfristige Daten</li>
          <li>Grafikkarte: Bildausgabe</li>
          <li>Soundkarte: Audio</li>
          <li>Mainboard: Verbindung der Komponenten</li>
          <li>Netzwerkkarte: Netzwerkverbindung</li>
        </ul>
        <p><strong>Punkte:</strong> ${points}/${HARDWARE_MAX_POINTS} | <strong>Sterne:</strong> ${stars}</p>
        <p><strong>Benötigte Versuche:</strong> ${hw.totalAttempts} | <strong>Verwendete Hinweise:</strong> ${hw.hintsUsed}</p>
      </div>
      <div class="taskbar">
        <button type="button" id="hw-to-map">Zur Weltkarte</button>
        <button type="button" id="hw-repeat" class="secondary-btn">Level wiederholen</button>
      </div>
    `;
    $("#hw-to-map").addEventListener("click", () => {
      setByteState("success");
      setSpeech("Klasse Leistung! Auf zur EVA-Station.");
      openScreen("map");
    });
    $("#hw-repeat").addEventListener("click", () => {
      levelRuntimes.hardware = createRuntime("hardware");
      openLevel("hardware");
    });
  }

  function renderConnectionRound({
    root,
    title,
    subtitle,
    leftItems,
    rightItems,
    links,
    onSuccess,
    onMistake,
    onRoundDone
  }) {
    root.innerHTML = `
      ${createMissionTitle(title, subtitle)}
      <div class="panel hw-link-board" id="hw-link-board">
        <svg id="hw-link-svg" class="hw-link-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"></svg>
        <div class="hw-link-col" id="hw-left-col">
          ${leftItems.map((item) => `<button type="button" class="tag hw-link-item" data-side="left" data-id="${item.id}" id="left-${item.id}">${item.icon} ${item.label}</button>`).join("")}
        </div>
        <div class="hw-link-col" id="hw-right-col">
          ${rightItems.map((item) => `<button type="button" class="tag hw-link-item" data-side="right" data-id="${item.id}" id="right-${item.id}">${item.label}</button>`).join("")}
        </div>
      </div>
      <p>Verbunden: ${Object.keys(links).length}/${leftItems.length}</p>
    `;
    drawLinkLines(links);
    let selected = "";
    root.querySelectorAll(".hw-link-item").forEach((button) => {
      const id = button.dataset.id;
      if (links[id] === id || Object.values(links).includes(id)) {
        button.classList.add("linked");
      }
      button.addEventListener("click", () => {
        if (button.classList.contains("linked")) return;
        if (button.dataset.side === "left") {
          selected = id;
          setFeedback(`${getHardwareComponent(selected).name} gewählt. Jetzt passende Zuordnung anklicken.`, "info");
          return;
        }
        if (!selected) {
          setFeedback("Wähle zuerst links eine Komponente.", "warn");
          return;
        }
        if (selected === id) {
          links[selected] = id;
          onSuccess(selected);
          drawLinkLines(links);
          selected = "";
          const done = leftItems.every((item) => links[item.id] === item.id);
          if (done) onRoundDone();
        } else {
          onMistake(selected);
          setFeedback("Diese Verbindung passt nicht. Die Linie wurde verworfen.", "warn");
          selected = "";
        }
      });
    });

    function drawLinkLines(currentLinks) {
      const board = $("#hw-link-board");
      const svgNode = $("#hw-link-svg");
      const rect = board.getBoundingClientRect();
      svgNode.setAttribute("viewBox", `0 0 ${Math.max(rect.width, 20)} ${Math.max(rect.height, 20)}`);
      svgNode.innerHTML = "";
      Object.keys(currentLinks).forEach((leftId) => {
        const rightId = currentLinks[leftId];
        if (leftId !== rightId) return;
        const leftNode = root.querySelector(`#left-${leftId}`);
        const rightNode = root.querySelector(`#right-${rightId}`);
        if (!leftNode || !rightNode) return;
        const l = leftNode.getBoundingClientRect();
        const r = rightNode.getBoundingClientRect();
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", String(l.right - rect.left));
        line.setAttribute("y1", String(l.top + (l.height / 2) - rect.top));
        line.setAttribute("x2", String(r.left - rect.left));
        line.setAttribute("y2", String(r.top + (r.height / 2) - rect.top));
        line.setAttribute("stroke", "#22c55e");
        line.setAttribute("stroke-width", "3");
        line.setAttribute("stroke-linecap", "round");
        svgNode.appendChild(line);
      });
    }
  }

  function wireHardwareComponentButtons(root, onClick) {
    root.querySelectorAll("[data-component]").forEach((node) => {
      node.addEventListener("click", () => onClick(node.dataset.component, node));
      node.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick(node.dataset.component, node);
        }
      });
    });
  }

  function renderHardwarePcSvg({
    labels = [],
    mode = "open",
    highlight = "",
    dimOthers = false,
    pulse = "",
    solved = [],
    focusTarget = "",
    placed = {},
    status = {}
  }) {
    const known = new Set(labels);
    const solvedSet = new Set(solved);
    const placedSet = new Set(Object.keys(placed));
    const statusMap = {
      power: !!status.power,
      monitor: !!status.monitor,
      network: !!status.network,
      dataFlow: !!status.dataFlow,
      systemOnline: !!status.systemOnline
    };
    const comp = (id, body) => {
      const isDim = dimOthers && highlight && highlight !== id;
      const classes = [
        "hw-component",
        known.has(id) ? "known" : "unknown",
        solvedSet.has(id) ? "solved" : "",
        placedSet.has(id) ? "placed" : "",
        highlight === id ? "highlight" : "",
        pulse === id || focusTarget === id ? "pulse" : "",
        isDim ? "dimmed" : ""
      ].filter(Boolean).join(" ");
      return `<g class="${classes}" data-component="${id}" tabindex="0" role="button" aria-label="${getHardwareComponent(id).name}">${body}</g>`;
    };
    const slotButton = (id, x, y, w, h, text) => `
      <foreignObject x="${x}" y="${y}" width="${w}" height="${h}">
        <button type="button" class="hw-slot-btn" data-slot="${id}" aria-label="${text}">${text}</button>
      </foreignObject>
    `;
    return `
      <div class="hw-pc-wrap ${mode === "assembly" ? "assembly" : ""}">
        <svg class="hw-pc-svg" viewBox="0 0 1000 620" role="img" aria-label="Geöffneter Desktop-PC mit Hardwarekomponenten">
          <rect x="20" y="20" width="960" height="580" rx="22" class="hw-case"></rect>
          <rect x="35" y="35" width="930" height="550" rx="16" class="hw-inner"></rect>
          <path d="M55 90 H945" class="hw-cable ${statusMap.power ? "live" : "alert"}"></path>
          <path d="M55 120 H945" class="hw-cable ${statusMap.network ? "live" : "alert"}"></path>
          <path d="M55 150 H945" class="hw-cable ${statusMap.dataFlow ? "live" : "alert"}"></path>

          ${comp("mainboard", `
            <rect x="215" y="125" width="470" height="360" rx="18" class="hw-mainboard"></rect>
            <path d="M250 180 H635 M250 220 H635 M250 260 H635 M250 300 H635 M250 340 H635" class="hw-trace ${statusMap.systemOnline ? "live" : ""}"></path>
            <text x="430" y="112" class="hw-label-anchor">Mainboard</text>
          `)}
          ${comp("cpu", `
            <rect x="335" y="200" width="90" height="90" rx="8" class="hw-chip"></rect>
            <circle cx="350" cy="215" r="3"></circle><circle cx="372" cy="215" r="3"></circle><circle cx="394" cy="215" r="3"></circle>
            <circle cx="350" cy="273" r="3"></circle><circle cx="372" cy="273" r="3"></circle><circle cx="394" cy="273" r="3"></circle>
            <text x="355" y="195" class="hw-label-anchor">CPU</text>
          `)}
          ${comp("ram", `
            <rect x="442" y="188" width="28" height="132" rx="4" class="hw-ram"></rect>
            <rect x="478" y="188" width="28" height="132" rx="4" class="hw-ram"></rect>
            <text x="444" y="182" class="hw-label-anchor">RAM</text>
          `)}
          ${comp("storage", `
            <rect x="720" y="350" width="170" height="110" rx="10" class="hw-drive"></rect>
            <circle cx="760" cy="405" r="18" class="hw-drive-ring"></circle>
            <rect x="790" y="388" width="78" height="10" rx="4" class="hw-drive-slot"></rect>
            <text x="730" y="345" class="hw-label-anchor">SSD/HDD</text>
          `)}
          ${comp("psu", `
            <rect x="65" y="80" width="130" height="150" rx="8" class="hw-psu"></rect>
            <circle cx="130" cy="154" r="36" class="hw-fan ${statusMap.power ? "spin" : ""}"></circle>
            <text x="72" y="72" class="hw-label-anchor">Netzteil</text>
          `)}
          ${comp("gpu", `
            <rect x="300" y="360" width="300" height="58" rx="8" class="hw-gpu"></rect>
            <circle cx="395" cy="389" r="18" class="hw-gpu-fan ${statusMap.monitor ? "spin" : ""}"></circle>
            <circle cx="505" cy="389" r="18" class="hw-gpu-fan ${statusMap.monitor ? "spin" : ""}"></circle>
            <text x="308" y="352" class="hw-label-anchor">Grafikkarte</text>
          `)}
          ${comp("sound", `
            <rect x="305" y="434" width="210" height="38" rx="8" class="hw-sound"></rect>
            <circle cx="485" cy="453" r="5"></circle><circle cx="498" cy="453" r="5"></circle>
            <text x="312" y="428" class="hw-label-anchor">Soundkarte</text>
          `)}
          ${comp("network", `
            <rect x="536" y="434" width="165" height="38" rx="8" class="hw-network"></rect>
            <rect x="668" y="444" width="24" height="18" rx="2" class="hw-rj45 ${statusMap.network ? "active" : ""}"></rect>
            <text x="542" y="428" class="hw-label-anchor">Netzwerkkarte</text>
          `)}

          <line x1="600" y1="388" x2="930" y2="388" class="hw-monitor-link ${statusMap.monitor ? "live" : "alert"}"></line>
          <line x1="130" y1="80" x2="130" y2="45" class="hw-power-link ${statusMap.power ? "live" : "alert"}"></line>
          <rect x="932" y="334" width="42" height="108" rx="6" class="hw-monitor"></rect>
          <rect x="938" y="346" width="30" height="66" rx="4" class="hw-monitor-screen ${statusMap.monitor ? "on" : "off"}"></rect>
          <text x="942" y="382" class="hw-monitor-text">${statusMap.systemOnline ? "SYSTEM ONLINE" : (statusMap.monitor ? "TEST" : "----")}</text>
          <rect x="75" y="35" width="112" height="16" rx="4" class="hw-power-led ${statusMap.power ? "on" : "off"}"></rect>
          <rect x="742" y="150" width="150" height="16" rx="4" class="hw-network-led ${statusMap.network ? "on" : "off"}"></rect>
          <circle cx="770" cy="160" r="4" class="hw-packet ${statusMap.network ? "move" : ""}"></circle>

          ${mode === "assembly" ? `
            ${slotButton("cpu", 326, 198, 110, 96, "Prozessor-Slot")}
            ${slotButton("ram", 437, 180, 78, 145, "RAM-Slot")}
            ${slotButton("storage", 714, 350, 185, 115, "Laufwerk-Slot")}
            ${slotButton("psu", 60, 78, 140, 156, "Netzteil-Slot")}
            ${slotButton("gpu", 293, 356, 318, 68, "Grafikkarten-Slot")}
            ${slotButton("sound", 299, 429, 222, 46, "Soundkarten-Slot")}
            ${slotButton("network", 531, 429, 178, 46, "Netzwerkkarten-Slot")}
          ` : ""}
        </svg>
      </div>
    `;
  }

  function applyRepairState(stateRef, componentId) {
    if (componentId === "psu") stateRef.power = true;
    if (componentId === "gpu") stateRef.monitor = true;
    if (componentId === "network") stateRef.network = true;
    if (componentId === "ram") stateRef.dataFlow = true;
  }

  function addHardwarePoints(runtime, key, points) {
    const hw = getHardwareState(runtime);
    if (hw.scoredKeys[key]) return;
    hw.scoredKeys[key] = true;
    hw.points += points;
  }

  function getHardwareStars(points, maxPoints) {
    const ratio = maxPoints ? (points / maxPoints) : 0;
    if (ratio >= 0.85) return 3;
    if (ratio >= 0.65) return 2;
    return points > 0 ? 1 : 0;
  }

  function getHardwareState(runtime) {
    runtime.data.usesOwnScoring = true;
    if (!runtime.data.hardware) {
      runtime.data.hardware = {
        discoveryIndex: 0,
        labelsVisible: [],
        points: 0,
        scoredKeys: {},
        totalAttempts: 0,
        hintsUsed: 0
      };
    }
    return runtime.data.hardware;
  }

  function getHardwareComponent(id) {
    return HARDWARE_COMPONENTS.find((entry) => entry.id === id);
  }

  function getHardwareIcon(id) {
    const icons = {
      mainboard: "🧩",
      cpu: "🧠",
      ram: "⚡",
      storage: "💾",
      psu: "🔌",
      gpu: "🖼️",
      sound: "🔊",
      network: "🌐"
    };
    return icons[id] || "🔹";
  }

  function getAssemblyHint(slotId) {
    const hints = {
      cpu: "Der Prozessor gehört auf den quadratischen Prozessorsockel.",
      ram: "Der Arbeitsspeicher gehört in die langen RAM-Steckplätze.",
      storage: "Der Festplattenspeicher gehört in den Laufwerksbereich.",
      psu: "Das Netzteil gehört in den größeren Netzteilbereich am Rand.",
      gpu: "Die Grafikkarte gehört in den langen Erweiterungssteckplatz.",
      sound: "Die Soundkarte gehört in den kleineren Erweiterungssteckplatz.",
      network: "Die Netzwerkkarte gehört in den Erweiterungssteckplatz mit Netzwerkanschluss."
    };
    return hints[slotId] || "Prüfe Form und Einbauort des Bauteils.";
  }

  const LEVEL_RENDERERS = {
    hardware: [
      (ctx) => startHardwareLevel(ctx),
      (ctx) => showComponentDiscovery(ctx),
      (ctx) => startComponentSearch(ctx),
      (ctx) => startComputerAssembly(ctx),
      (ctx) => startFunctionAndComparison(ctx),
      (ctx) => startRepairMission(ctx)
    ],

    eva: [
      ({ root, runtime, complete, mistake }) => {
        const tokens = [
          { name: "Tastatureingabe", zone: "Eingabe" },
          { name: "Rechenvorgang", zone: "Verarbeitung" },
          { name: "Bildschirmausgabe", zone: "Ausgabe" },
          { name: "Zwischenergebnis speichern", zone: "Speicher" }
        ];
        if (!runtime.data.evaPlaced) runtime.data.evaPlaced = {};
        root.innerHTML = `
          ${createMissionTitle("Mission 1: EVA-Maschine bestücken", "Platziere jeden Vorgang im richtigen EVA-Bereich.")}
          <div class="mission-grid">
            <div class="eva-machine panel" id="eva-zones">
              ${["Eingabe", "Verarbeitung", "Ausgabe", "Speicher"].map((zone) => `<div class="zone" data-zone="${zone}"><strong>${zone}</strong></div>`).join("")}
            </div>
            <div class="parts-bank panel" id="eva-tokens">
              ${tokens.map((token) => `<button type="button" draggable="true" class="part-card" data-token="${token.name}">${token.name}</button>`).join("")}
            </div>
          </div>
        `;
        const tokenNodes = [...root.querySelectorAll("[data-token]")];
        const zones = [...root.querySelectorAll("[data-zone]")];
        setupPlaceInteraction(tokenNodes, zones, runtime.data, (selected, slot) => {
          const item = tokens.find((entry) => entry.name === selected);
          if (item && item.zone === slot.dataset.zone) {
            runtime.data.evaPlaced[selected] = slot.dataset.zone;
            slot.classList.add("good");
            slot.innerHTML += `<div>${selected}</div>`;
            const done = tokens.every((entry) => runtime.data.evaPlaced[entry.name]);
            if (done) complete();
          } else {
            slot.dataset.filled = "";
            mistake("Diese Zuordnung passt nicht. Prüfe Eingabe/Verarbeitung/Ausgabe/Speicher.");
          }
        }, () => {
          mistake("Diese Zuordnung passt nicht. Prüfe die EVA-Phase.");
        });
      },
      ({ root, runtime, complete, mistake }) => {
        const expected = ["Eingabe", "Verarbeitung", "Speicher", "Ausgabe"];
        if (!runtime.data.evaOrder) runtime.data.evaOrder = shuffle([...expected]);
        root.innerHTML = `
          ${createMissionTitle("Mission 2: Datenfluss aktivieren", "Bringe die EVA-Reihenfolge in Ordnung und starte das Datenpaket.")}
          <div class="panel">
            <div class="bit-row" id="eva-order">
              ${runtime.data.evaOrder.map((item) => `<button type="button" class="part-card" data-item="${item}">${item}</button>`).join("")}
            </div>
            <div class="taskbar">
              <button type="button" id="eva-check">Reihenfolge prüfen</button>
              <button type="button" id="eva-rotate" class="secondary-btn">Element nach rechts schieben</button>
            </div>
            <div class="packet-track"><div id="eva-packet" class="packet"></div></div>
          </div>
        `;
        root.querySelectorAll("[data-item]").forEach((button, idx, arr) => {
          button.addEventListener("click", () => {
            if (idx < arr.length - 1) {
              [runtime.data.evaOrder[idx], runtime.data.evaOrder[idx + 1]] = [runtime.data.evaOrder[idx + 1], runtime.data.evaOrder[idx]];
              LEVEL_RENDERERS.eva[1]({ root, runtime, complete, mistake });
            }
          });
        });
        $("#eva-rotate").addEventListener("click", () => {
          const last = runtime.data.evaOrder.pop();
          runtime.data.evaOrder.unshift(last);
          LEVEL_RENDERERS.eva[1]({ root, runtime, complete, mistake });
        });
        $("#eva-check").addEventListener("click", () => {
          const ok = runtime.data.evaOrder.every((entry, i) => entry === expected[i]);
          if (!ok) {
            mistake("Noch nicht korrekt. Der Ablauf beginnt bei Eingabe und endet bei Ausgabe.");
            return;
          }
          $("#eva-packet").classList.add("run");
          setSpeech("Datenpaket läuft durch die EVA-Maschine.");
          setTimeout(complete, 900);
        });
      },
      ({ root, runtime, complete, mistake }) => {
        const expected = ["Ticketziel wählen", "Daten verarbeiten", "Preis anzeigen", "Ticket drucken"];
        if (!runtime.data.ticketFlow) runtime.data.ticketFlow = shuffle([...expected]);
        root.innerHTML = `
          ${createMissionTitle("Abschlussmission: Fahrkartenautomat", "Setze den Ablauf korrekt zusammen, dann startet die Maschine sichtbar.")}
          <div class="panel">
            <ol id="ticket-flow">
              ${runtime.data.ticketFlow.map((step) => `<li class="sort-item"><span>${step}</span><button type="button" data-down="${escapeHtml(step)}">nach unten</button></li>`).join("")}
            </ol>
            <div class="taskbar"><button type="button" id="ticket-check">Ablauf starten</button></div>
            <p id="ticket-state">Maschine: Standby</p>
          </div>
        `;
        root.querySelectorAll("[data-down]").forEach((button, index) => {
          button.addEventListener("click", () => {
            if (index >= runtime.data.ticketFlow.length - 1) return;
            [runtime.data.ticketFlow[index], runtime.data.ticketFlow[index + 1]] = [runtime.data.ticketFlow[index + 1], runtime.data.ticketFlow[index]];
            LEVEL_RENDERERS.eva[2]({ root, runtime, complete, mistake });
          });
        });
        $("#ticket-check").addEventListener("click", () => {
          const ok = runtime.data.ticketFlow.every((entry, i) => entry === expected[i]);
          if (!ok) {
            mistake("Der Ablauf ist noch falsch. Prüfe Eingabe → Verarbeitung → Ausgabe.");
            return;
          }
          $("#ticket-state").textContent = "Maschine: ONLINE ✅";
          complete();
        });
      }
    ],

    bitbyte: [
      ({ root, runtime, complete, mistake }) => {
        const target = "01000001";
        if (!runtime.data.bitsA) runtime.data.bitsA = "00000000".split("");
        root.innerHTML = `
          ${createMissionTitle("Mission 1: Bit-Schalter", `Stelle das Byte ${target} ein.`)}
          <div class="panel">
            <div class="bit-switches" id="bit-grid">${runtime.data.bitsA.map((bit, idx) => `<button type="button" class="bit-switch ${bit === "1" ? "on" : ""}" data-bit="${idx}">${bit}</button>`).join("")}</div>
            <p>Aktuell: <strong id="bit-current">${runtime.data.bitsA.join("")}</strong></p>
            <div class="taskbar"><button type="button" id="bit-check">Byte prüfen</button></div>
          </div>
        `;
        root.querySelectorAll("[data-bit]").forEach((button) => {
          button.addEventListener("click", () => {
            const idx = Number(button.dataset.bit);
            runtime.data.bitsA[idx] = runtime.data.bitsA[idx] === "0" ? "1" : "0";
            LEVEL_RENDERERS.bitbyte[0]({ root, runtime, complete, mistake });
          });
        });
        $("#bit-check").addEventListener("click", () => {
          if (runtime.data.bitsA.join("") !== target) {
            mistake("Bitmuster noch nicht korrekt. Vergleiche jede Position von links nach rechts.");
            return;
          }
          complete();
        });
      },
      ({ root, runtime, complete, mistake }) => {
        root.innerHTML = `
          ${createMissionTitle("Mission 2: Byte-zu-Zeichen", "Nutze die Codiertabelle und entschlüssele zwei Bytes.")}
          <div class="panel">
            <p>Kleine Tabelle: A=01000001, B=01000010, C=01000011, H=01001000, I=01001001</p>
            <label for="decode1">01000011 = </label> <input id="decode1" type="text" maxlength="1">
            <label for="decode2">01001000 = </label> <input id="decode2" type="text" maxlength="1">
            <div class="taskbar"><button type="button" id="decode-check">Entschlüsseln</button></div>
          </div>
        `;
        $("#decode-check").addEventListener("click", () => {
          const c1 = normalize($("#decode1").value);
          const c2 = normalize($("#decode2").value);
          if (c1 === "c" && c2 === "h") {
            complete();
          } else {
            mistake("Mindestens ein Zeichen stimmt noch nicht. Nutze die Tabelle direkt.");
          }
        });
      },
      ({ root, runtime, complete, mistake }) => {
        root.innerHTML = `
          ${createMissionTitle("Abschlussmission: Digitale Tür", "Entschlüssele die Nachricht 01001000 01001001 und öffne die Tür.")}
          <div class="panel">
            <p>Tabelle: H=01001000, I=01001001</p>
            <label for="door-msg">Nachricht:</label>
            <input id="door-msg" type="text" aria-label="Nachricht eingeben">
            <div class="taskbar"><button type="button" id="door-open">Tür öffnen</button></div>
            <p id="door-state">🔒 Tür geschlossen</p>
          </div>
        `;
        $("#door-open").addEventListener("click", () => {
          const value = normalize($("#door-msg").value).replaceAll(" ", "");
          if (value !== "hi") {
            mistake("Die Nachricht ist noch nicht korrekt entschlüsselt.");
            return;
          }
          $("#door-state").textContent = "🔓 Tür geöffnet";
          setSpeech("Die Bit-und-Byte-Tür ist offen!");
          complete();
        });
      }
    ],

    dateien: [
      ({ root, complete, mistake }) => {
        root.innerHTML = `
          ${createMissionTitle("Mission 1: Dateiname und Endung markieren", "Markiere Name und Endung direkt an den Dateien.")}
          <div class="panel">
            <p>Datei 1:</p>
            <div class="file-tag">
              <button type="button" id="f1-name">hund</button>
              <button type="button" id="f1-end">.wav</button>
            </div>
            <p>Datei 2:</p>
            <div class="file-tag">
              <button type="button" id="f2-name">ferienfoto</button>
              <button type="button" id="f2-end">.png</button>
            </div>
            <div class="taskbar"><button type="button" id="file-mark-check">Markierung prüfen</button></div>
          </div>
        `;
        ["f1-name", "f1-end", "f2-name", "f2-end"].forEach((id) => {
          $(`#${id}`).addEventListener("click", (event) => {
            event.currentTarget.classList.toggle("marked");
          });
        });
        $("#file-mark-check").addEventListener("click", () => {
          const ok = $("#f1-name").classList.contains("marked")
            && $("#f1-end").classList.contains("marked")
            && $("#f2-name").classList.contains("marked")
            && $("#f2-end").classList.contains("marked");
          if (!ok) {
            mistake("Markiere alle vier Bereiche: beide Dateinamen und beide Endungen.");
            return;
          }
          complete();
        });
      },
      ({ root, runtime, complete, mistake }) => {
        const files = [
          { name: "lied.wav", folder: "Audio" },
          { name: "protokoll.txt", folder: "Text" },
          { name: "bildschirm.png", folder: "Bild" }
        ];
        if (!runtime.data.archivePlaced) runtime.data.archivePlaced = {};
        root.innerHTML = `
          ${createMissionTitle("Mission 2: Dateien einsortieren", "Verschiebe die Dateien in passende Ordner.")}
          <div class="mission-grid">
            <div class="folder-grid panel">
              ${["Bild", "Audio", "Text"].map((name) => `<div class="folder" data-folder="${name}"><h4>${name}</h4></div>`).join("")}
            </div>
            <div class="parts-bank panel">
              ${files.map((file) => `<button type="button" class="part-card" draggable="true" data-part="${file.name}">${file.name}</button>`).join("")}
            </div>
          </div>
        `;
        const parts = [...root.querySelectorAll("[data-part]")];
        const slots = [...root.querySelectorAll("[data-folder]")];
        setupPlaceInteraction(parts, slots, runtime.data, (selected, slot) => {
          const file = files.find((entry) => entry.name === selected);
          if (file.folder === slot.dataset.folder) {
            runtime.data.archivePlaced[selected] = slot.dataset.folder;
            slot.innerHTML += `<div>${selected}</div>`;
            const done = files.every((entry) => runtime.data.archivePlaced[entry.name]);
            if (done) complete();
          } else {
            slot.dataset.filled = "";
            mistake("Dieser Ordner passt nicht zur Dateiendung.");
          }
        }, () => mistake("Ordner passt nicht zur Datei."));
      },
      ({ root, runtime, complete, mistake }) => {
        const pairs = [
          ["ASCII", "Byte-Zeichen-Zuordnung"],
          ["Morsecode", "Punkte und Striche"],
          ["Blindenschrift", "Punktmuster zum Tasten"]
        ];
        if (!runtime.data.codeLinks) runtime.data.codeLinks = {};
        root.innerHTML = `
          ${createMissionTitle("Mission 3: Codierungsarten zuordnen", "Verbinde jede Codierungsart mit der passenden Darstellung.")}
          <div class="match-columns">
            <div class="panel">${pairs.map(([left]) => `<button type="button" class="tag" data-side="left" data-value="${left}">${left}</button>`).join("")}</div>
            <div class="panel">${shuffle(pairs.map(([, right]) => right)).map((right) => `<button type="button" class="tag" data-side="right" data-value="${right}">${right}</button>`).join("")}</div>
          </div>
        `;
        let selectedLeft = null;
        root.querySelectorAll(".tag").forEach((button) => {
          button.addEventListener("click", () => {
            if (button.dataset.side === "left") {
              selectedLeft = button.dataset.value;
              return;
            }
            if (!selectedLeft) return;
            const correct = pairs.some(([l, r]) => l === selectedLeft && r === button.dataset.value);
            if (!correct) {
              mistake("Diese Codierungszuordnung ist noch falsch.");
              return;
            }
            runtime.data.codeLinks[selectedLeft] = button.dataset.value;
            button.classList.add("linked");
            const leftNode = root.querySelector(`[data-side="left"][data-value="${selectedLeft}"]`);
            if (leftNode) leftNode.classList.add("linked");
            selectedLeft = null;
            if (Object.keys(runtime.data.codeLinks).length === pairs.length) complete();
          });
        });
      },
      ({ root, runtime, complete, mistake }) => {
        const entries = [
          { file: "ferienbild.png", ok: true },
          { file: "report.mp3", ok: false },
          { file: "notizen.txt", ok: true },
          { file: "tonspur.wav", ok: true },
          { file: "diagramm.wav", ok: false }
        ];
        if (!runtime.data.badFiles) runtime.data.badFiles = [];
        root.innerHTML = `
          ${createMissionTitle("Abschlussmission: Archivfehler finden", "Markiere die falsch einsortierten oder beschädigten Dateien.")}
          <div class="panel">
            ${entries.map((entry, idx) => `<button type="button" class="incident ${runtime.data.badFiles.includes(idx) ? "good" : ""}" data-index="${idx}">${entry.file}</button>`).join("")}
            <div class="taskbar"><button type="button" id="archive-check">Archiv reparieren</button></div>
          </div>
        `;
        root.querySelectorAll("[data-index]").forEach((button) => {
          button.addEventListener("click", () => {
            const idx = Number(button.dataset.index);
            if (runtime.data.badFiles.includes(idx)) {
              runtime.data.badFiles = runtime.data.badFiles.filter((value) => value !== idx);
            } else {
              runtime.data.badFiles.push(idx);
            }
            LEVEL_RENDERERS.dateien[3]({ root, runtime, complete, mistake });
          });
        });
        $("#archive-check").addEventListener("click", () => {
          const selected = [...runtime.data.badFiles].sort((a, b) => a - b);
          const expected = entries.map((entry, idx) => (!entry.ok ? idx : null)).filter((idx) => idx !== null);
          if (JSON.stringify(selected) !== JSON.stringify(expected)) {
            mistake("Noch nicht korrekt. Prüfe Dateityp und Endung erneut.");
            return;
          }
          complete();
        });
      }
    ],

    betriebssystem: [
      ({ root, runtime, complete, mistake }) => {
        const incidents = [
          { text: "Drucker wird nicht erkannt", zone: "Geräteverwaltung" },
          { text: "Zwei Programme brauchen RAM", zone: "Speicherverwaltung" },
          { text: "Datei soll in Ordner verschoben werden", zone: "Dateiverwaltung" }
        ];
        runtime.data.osStep = runtime.data.osStep || 0;
        const current = incidents[runtime.data.osStep];
        root.innerHTML = `
          ${createMissionTitle("Mission 1: Störungen beheben", current ? `Aktive Störung: ${current.text}` : "Mission abgeschlossen")}
          <div class="panel device-grid">
            ${["Prozessverwaltung", "Speicherverwaltung", "Dateiverwaltung", "Geräteverwaltung", "Benutzeroberfläche", "Sicherheit und Rechte", "Netzwerk und Kommunikation"]
              .map((zone) => `<button type="button" class="incident" data-zone="${zone}">${zone}</button>`)
              .join("")}
          </div>
        `;
        root.querySelectorAll("[data-zone]").forEach((button) => {
          button.addEventListener("click", () => {
            if (!current) return;
            if (button.dataset.zone !== current.zone) {
              mistake("Dieser Bereich löst die aktuelle Störung nicht.");
              return;
            }
            runtime.data.osStep += 1;
            if (runtime.data.osStep >= incidents.length) {
              complete();
            } else {
              LEVEL_RENDERERS.betriebssystem[0]({ root, runtime, complete, mistake });
            }
          });
        });
      },
      ({ root, runtime, complete, mistake }) => {
        const incidents = [
          { text: "Programm starten oder beenden", zone: "Prozessverwaltung" },
          { text: "Benutzer ohne Berechtigung", zone: "Sicherheit und Rechte" },
          { text: "Verbindung zu anderem Rechner", zone: "Netzwerk und Kommunikation" },
          { text: "Fenster und Menüs anzeigen", zone: "Benutzeroberfläche" }
        ];
        runtime.data.osStep2 = runtime.data.osStep2 || 0;
        const current = incidents[runtime.data.osStep2];
        root.innerHTML = `
          ${createMissionTitle("Mission 2: Kontrollzentrale", current ? `Aktive Störung: ${current.text}` : "Mission abgeschlossen")}
          <div class="panel device-grid">
            ${["Prozessverwaltung", "Speicherverwaltung", "Dateiverwaltung", "Geräteverwaltung", "Benutzeroberfläche", "Sicherheit und Rechte", "Netzwerk und Kommunikation"]
              .map((zone) => `<button type="button" class="incident" data-zone="${zone}">${zone}</button>`)
              .join("")}
          </div>
        `;
        root.querySelectorAll("[data-zone]").forEach((button) => {
          button.addEventListener("click", () => {
            if (!current) return;
            if (button.dataset.zone !== current.zone) {
              mistake("Dieser Bereich ist gerade nicht der richtige.");
              return;
            }
            runtime.data.osStep2 += 1;
            if (runtime.data.osStep2 >= incidents.length) {
              complete();
            } else {
              LEVEL_RENDERERS.betriebssystem[1]({ root, runtime, complete, mistake });
            }
          });
        });
      },
      ({ root, runtime, complete, mistake }) => {
        const modules = ["Prozessverwaltung", "Speicherverwaltung", "Dateiverwaltung", "Geräteverwaltung", "Benutzeroberfläche", "Sicherheit und Rechte", "Netzwerk und Kommunikation"];
        if (!runtime.data.osActivated) runtime.data.osActivated = [];
        root.innerHTML = `
          ${createMissionTitle("Abschlussmission: OS vollständig verbinden", "Aktiviere alle Systemmodule.")}
          <div class="panel device-grid">
            ${modules.map((module) => `<button type="button" class="incident ${runtime.data.osActivated.includes(module) ? "good" : ""}" data-module="${module}">${module}</button>`).join("")}
          </div>
          <p>Aktiviert: ${runtime.data.osActivated.length}/${modules.length}</p>
        `;
        root.querySelectorAll("[data-module]").forEach((button) => {
          button.addEventListener("click", () => {
            const module = button.dataset.module;
            if (!runtime.data.osActivated.includes(module)) {
              runtime.data.osActivated.push(module);
            }
            if (runtime.data.osActivated.length === modules.length) {
              complete();
            } else {
              LEVEL_RENDERERS.betriebssystem[2]({ root, runtime, complete, mistake });
            }
          });
        });
      }
    ],

    objekte: [
      ({ root, runtime, complete, mistake }) => {
        runtime.data.bike = runtime.data.bike || {
          art: "Citybike",
          farbe: "Blau",
          gaenge: "7",
          besitzer: "Alex",
          repariert: true
        };
        renderBikeWorkshop(root, runtime.data.bike, "Mission 1: Objekt konfigurieren", "Ändere Attribute. Fahrrad und Objektdiagramm aktualisieren sich gleichzeitig.");
        appendTaskbar(root, [{
          label: "Konfiguration prüfen",
          onClick: () => {
            const bike = runtime.data.bike;
            if (!bike.art || !bike.farbe || !bike.gaenge || !bike.besitzer) {
              mistake("Bitte alle Attribute ausfüllen.");
              return;
            }
            complete();
          }
        }]);
      },
      ({ root, runtime, complete }) => {
        runtime.data.bike = runtime.data.bike || {
          art: "Citybike",
          farbe: "Blau",
          gaenge: "7",
          besitzer: "Alex",
          repariert: true
        };
        renderBikeWorkshop(root, runtime.data.bike, "Mission 2: Methoden ausführen", "Führe fahren(), reparieren() und lackieren() als Aktionen aus.");
        const done = runtime.data.methodsDone || [];
        appendTaskbar(root, [
          {
            label: "fahren()",
            onClick: () => {
              donePush(done, "fahren");
              const svg = root.querySelector(".bike-svg");
              if (svg) {
                svg.classList.remove("bike-anim-ride");
                svg.offsetWidth;
                svg.classList.add("bike-anim-ride");
              }
              setFeedback("Methode fahren() ausgeführt.", "ok");
              runtime.data.methodsDone = done;
              if (done.length >= 3) complete();
            }
          },
          {
            label: "reparieren()",
            onClick: () => {
              donePush(done, "reparieren");
              runtime.data.bike.repariert = true;
              root.querySelector('[data-field="zustand"]').textContent = "bereit";
              setFeedback("Methode reparieren() ausgeführt.", "ok");
              runtime.data.methodsDone = done;
              if (done.length >= 3) complete();
            }
          },
          {
            label: "lackieren()",
            onClick: () => {
              donePush(done, "lackieren");
              runtime.data.bike.farbe = "Rot";
              const color = root.querySelector("#bike-color-select");
              if (color) color.value = "Rot";
              rerenderBikeVisual(root, runtime.data.bike);
              runtime.data.methodsDone = done;
              setFeedback("Methode lackieren() ausgeführt. Farbe geändert.", "ok");
              if (done.length >= 3) complete();
            }
          }
        ]);
      },
      ({ root, runtime, complete, mistake }) => {
        runtime.data.bike = runtime.data.bike || {
          art: "Citybike",
          farbe: "Blau",
          gaenge: "7",
          besitzer: "Alex",
          repariert: true
        };
        renderBikeWorkshop(root, runtime.data.bike, "Abschlussmission: TimsFahrrad : FAHRRAD", "Setze Art=Rennrad, Farbe=Rot, Anzahl der Gänge=14, Besitzer=Tim.");
        appendTaskbar(root, [{
          label: "Objekt zusammensetzen",
          onClick: () => {
            const bike = runtime.data.bike;
            const ok = bike.art === "Rennrad" && bike.farbe === "Rot" && normalize(bike.gaenge) === "14" && normalize(bike.besitzer) === "tim";
            if (!ok) {
              mistake("Noch nicht korrekt. Prüfe die vier geforderten Attributwerte.");
              return;
            }
            complete();
          }
        }]);
      }
    ],

    klassen: [
      ({ root, runtime, complete, mistake }) => {
        const tokens = [
          { text: "FAHRRAD", zone: "name" },
          { text: "art: Text", zone: "attr" },
          { text: "farbe: Text", zone: "attr" },
          { text: "anzahlDerGaenge: Zahl", zone: "attr" },
          { text: "besitzer: Text", zone: "attr" },
          { text: "fahren()", zone: "method" },
          { text: "reparieren()", zone: "method" },
          { text: "anschließen()", zone: "method" },
          { text: "lackieren()", zone: "method" }
        ];
        runtime.data.classPlaced = runtime.data.classPlaced || {};
        root.innerHTML = `
          ${createMissionTitle("Mission 1: Klassendiagramm aufbauen", "Ziehe passende Elemente in Klassenname, Attribute und Methoden.")}
          <div class="mission-grid">
            <div class="class-diagram panel">
              <div class="class-cell" data-zone="name"><strong>Klassenname</strong></div>
              <div class="class-cell" data-zone="attr"><strong>Attribute mit Datentypen</strong></div>
              <div class="class-cell" data-zone="method"><strong>Methoden</strong></div>
            </div>
            <div class="token-bank panel">
              ${tokens.map((token) => `<button type="button" draggable="true" class="token" data-part="${token.text}">${token.text}</button>`).join("")}
            </div>
          </div>
        `;
        const parts = [...root.querySelectorAll(".token")];
        const slots = [...root.querySelectorAll(".class-cell")];
        setupPlaceInteraction(parts, slots, runtime.data, (selected, slot) => {
          const token = tokens.find((entry) => entry.text === selected);
          if (!token || token.zone !== slot.dataset.zone) {
            slot.dataset.filled = "";
            mistake("Dieses Element gehört in einen anderen Bereich des Klassendiagramms.");
            return;
          }
          runtime.data.classPlaced[selected] = slot.dataset.zone;
          slot.innerHTML += `<div>${selected}</div>`;
          slot.dataset.filled = "";
          const done = tokens.every((entry) => runtime.data.classPlaced[entry.text]);
          if (done) complete();
        }, () => mistake("Dieses Element gehört in einen anderen Bereich."));
      },
      ({ root, complete }) => {
        root.innerHTML = `
          ${createMissionTitle("Mission 2: Objekte aus Klasse erzeugen", "Aus dem Bauplan entstehen mehrere konkrete Fahrradobjekte.")}
          <div class="panel">
            <button type="button" id="spawn-objects">Objekte erzeugen</button>
            <div id="object-cards" class="folder-grid"></div>
          </div>
        `;
        $("#spawn-objects").addEventListener("click", () => {
          $("#object-cards").innerHTML = `
            <div class="folder"><strong>LisasBike : FAHRRAD</strong><p>Art: Citybike</p><p>Farbe: Blau</p><p>Gänge: 7</p></div>
            <div class="folder"><strong>TimsBike : FAHRRAD</strong><p>Art: Rennrad</p><p>Farbe: Rot</p><p>Gänge: 14</p></div>
            <div class="folder"><strong>SamisBike : FAHRRAD</strong><p>Art: MTB</p><p>Farbe: Grün</p><p>Gänge: 18</p></div>
          `;
          complete();
        });
      },
      ({ root, complete, mistake }) => {
        root.innerHTML = `
          ${createMissionTitle("Abschlussmission: Konkretes Objekt ableiten", "Erstelle TimsFahrrad : FAHRRAD aus dem Bauplan.")}
          <div class="panel">
            <label for="obj-name">Objektname:</label> <input id="obj-name" type="text" value="TimsFahrrad"><br>
            <label for="obj-class">Klasse:</label> <input id="obj-class" type="text" value="FAHRRAD"><br>
            <label for="obj-art">Art:</label> <input id="obj-art" type="text" value="Rennrad"><br>
            <label for="obj-farbe">Farbe:</label> <input id="obj-farbe" type="text" value="Rot"><br>
            <label for="obj-gaenge">Gänge:</label> <input id="obj-gaenge" type="text" value="14"><br>
            <label for="obj-besitzer">Besitzer:</label> <input id="obj-besitzer" type="text" value="Tim"><br>
            <div class="taskbar"><button type="button" id="obj-check">Objekt erzeugen</button></div>
          </div>
        `;
        $("#obj-check").addEventListener("click", () => {
          const ok = normalize($("#obj-name").value) === "timsfahrrad"
            && normalize($("#obj-class").value) === "fahrrad"
            && normalize($("#obj-art").value) === "rennrad"
            && normalize($("#obj-farbe").value) === "rot"
            && normalize($("#obj-gaenge").value) === "14"
            && normalize($("#obj-besitzer").value) === "tim";
          if (!ok) {
            mistake("Mindestens ein Wert stimmt noch nicht mit dem Zielobjekt überein.");
            return;
          }
          complete();
        });
      }
    ]
  };

  function renderBikeWorkshop(root, bike, title, subtitle) {
    root.innerHTML = `
      ${createMissionTitle(title, subtitle)}
      <div class="bike-wrap">
        <div class="panel">
          <label for="bike-type-select">Fahrradart:</label>
          <select id="bike-type-select">
            ${["Citybike", "Rennrad", "MTB", "Trekkingrad"].map((entry) => `<option value="${entry}" ${bike.art === entry ? "selected" : ""}>${entry}</option>`).join("")}
          </select><br>
          <label for="bike-color-select">Farbe:</label>
          <select id="bike-color-select">
            ${["Blau", "Rot", "Grün", "Schwarz", "Gelb"].map((entry) => `<option value="${entry}" ${bike.farbe === entry ? "selected" : ""}>${entry}</option>`).join("")}
          </select><br>
          <label for="bike-gears-input">Anzahl der Gänge:</label>
          <input id="bike-gears-input" type="number" min="1" max="30" value="${escapeHtml(bike.gaenge)}"><br>
          <label for="bike-owner-input">Besitzer:</label>
          <input id="bike-owner-input" type="text" value="${escapeHtml(bike.besitzer)}">
        </div>
        <div class="panel">
          <svg class="bike-svg" viewBox="0 0 420 220" role="img" aria-label="Fahrradobjekt">
            <circle cx="95" cy="165" r="42" stroke="#cbd5e1" stroke-width="8" fill="none"></circle>
            <circle cx="312" cy="165" r="42" stroke="#cbd5e1" stroke-width="8" fill="none"></circle>
            <line x1="95" y1="165" x2="190" y2="100" stroke="currentColor" stroke-width="8"></line>
            <line x1="190" y1="100" x2="312" y2="165" stroke="currentColor" stroke-width="8"></line>
            <line x1="95" y1="165" x2="250" y2="165" stroke="currentColor" stroke-width="8"></line>
            <line x1="190" y1="100" x2="232" y2="70" stroke="currentColor" stroke-width="8"></line>
            <line x1="240" y1="70" x2="283" y2="70" stroke="currentColor" stroke-width="8"></line>
            <line x1="175" y1="96" x2="170" y2="62" stroke="currentColor" stroke-width="8"></line>
            <line x1="154" y1="62" x2="190" y2="62" stroke="currentColor" stroke-width="8"></line>
            <rect id="bike-frame" x="140" y="114" width="130" height="16" rx="8" fill="#2563eb"></rect>
          </svg>
          <h4>Objektdiagramm</h4>
          <p><strong><span id="bike-object-name">MeinFahrrad</span> : FAHRRAD</strong></p>
          <ul>
            <li>Art = <span data-field="art">${escapeHtml(bike.art)}</span></li>
            <li>Farbe = <span data-field="farbe">${escapeHtml(bike.farbe)}</span></li>
            <li>Anzahl der Gänge = <span data-field="gaenge">${escapeHtml(bike.gaenge)}</span></li>
            <li>Besitzer = <span data-field="besitzer">${escapeHtml(bike.besitzer)}</span></li>
            <li>Zustand = <span data-field="zustand">${bike.repariert ? "bereit" : "wartet auf Reparatur"}</span></li>
          </ul>
        </div>
      </div>
    `;
    const update = () => {
      bike.art = $("#bike-type-select").value;
      bike.farbe = $("#bike-color-select").value;
      bike.gaenge = $("#bike-gears-input").value;
      bike.besitzer = $("#bike-owner-input").value;
      rerenderBikeVisual(root, bike);
    };
    ["bike-type-select", "bike-color-select", "bike-gears-input", "bike-owner-input"].forEach((id) => {
      const node = $(`#${id}`);
      node.addEventListener("input", update);
      node.addEventListener("change", update);
    });
    rerenderBikeVisual(root, bike);
  }

  function rerenderBikeVisual(root, bike) {
    const frame = root.querySelector("#bike-frame");
    const map = {
      Blau: "#2563eb",
      Rot: "#dc2626",
      Grün: "#16a34a",
      Schwarz: "#0f172a",
      Gelb: "#facc15"
    };
    if (frame) frame.setAttribute("fill", map[bike.farbe] || "#2563eb");
    setText(root, '[data-field="art"]', bike.art);
    setText(root, '[data-field="farbe"]', bike.farbe);
    setText(root, '[data-field="gaenge"]', bike.gaenge);
    setText(root, '[data-field="besitzer"]', bike.besitzer);
  }

  function setText(root, selector, value) {
    const node = root.querySelector(selector);
    if (node) node.textContent = value;
  }

  function donePush(arr, value) {
    if (!arr.includes(value)) arr.push(value);
  }

  function shuffle(items) {
    const arr = [...items];
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
})();
