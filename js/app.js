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
    queueDialog(getLevel(levelId).intro);
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
        runtime.missionPoints += POINTS_PER_MISSION;
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

  function queueDialog(lines) {
    if (!Array.isArray(lines) || lines.length === 0) return;
    let index = 0;
    setSpeech(lines[index]);
    ui.dialogNextBtn.classList.remove("hidden");
    ui.dialogNextBtn.onclick = () => {
      index += 1;
      if (index >= lines.length) {
        ui.dialogNextBtn.classList.add("hidden");
        ui.dialogNextBtn.onclick = null;
        return;
      }
      setSpeech(lines[index]);
    };
  }

  function setSpeech(text) {
    ui.mascotSpeech.textContent = text || "";
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

  const LEVEL_RENDERERS = {
    hardware: [
      ({ root, runtime, complete, mistake }) => {
        const found = runtime.data.foundParts || [];
        const order = [
          "Mainboard",
          "Prozessor",
          "Arbeitsspeicher",
          "Netzteil",
          "Festplattenspeicher",
          "Grafikkarte",
          "Soundkarte",
          "Netzwerkkarte"
        ];
        const target = order[found.length];
        root.innerHTML = `
          ${createMissionTitle("Mission 1: Bauteile entdecken", `Klicke auf: ${target || "Fertig"}`)}
          <div class="board panel" id="hw-discover-board">
            ${order.map((name) => `<button type="button" class="slot ${found.includes(name) ? "correct" : ""}" data-part="${name}" aria-label="${name}">${found.includes(name) ? name : "?"}</button>`).join("")}
          </div>
        `;
        const board = $("#hw-discover-board");
        board.querySelectorAll(".slot").forEach((slot) => {
          slot.addEventListener("click", () => {
            const chosen = slot.dataset.part;
            if (chosen === target) {
              if (!runtime.data.foundParts) runtime.data.foundParts = [];
              runtime.data.foundParts.push(chosen);
              setSpeech(`${chosen} korrekt! ${hardwareHint(chosen)}`);
              if (runtime.data.foundParts.length === order.length) {
                complete();
              } else {
                LEVEL_RENDERERS.hardware[0]({ root, runtime, complete, mistake });
              }
            } else if (!runtime.data.foundParts?.includes(chosen)) {
              mistake("Das war es noch nicht. Orientierung: Suche die passende Position für das genannte Bauteil.");
              setSpeech("Fast! Schau auf die typische Lage der Bauteile im Rechner.");
            }
          });
        });
      },
      ({ root, runtime, complete, mistake }) => {
        root.innerHTML = `
          ${createMissionTitle("Mission 2: Computer zusammenbauen", "Ziehe Bauteile in passende Plätze oder: Bauteil anklicken, dann Ziel anklicken.")}
          <div class="mission-grid">
            <div class="board panel" id="hw-build-board">
              ${["Mainboard", "Prozessor", "Arbeitsspeicher", "Netzteil", "Festplattenspeicher", "Grafikkarte", "Soundkarte", "Netzwerkkarte"]
                .map((name) => `<div class="slot" data-accept="${name}" aria-label="Slot ${name}">${name}‑Slot</div>`)
                .join("")}
            </div>
            <div class="parts-bank panel" id="hw-parts-bank">
              ${shuffle(["Mainboard", "Prozessor", "Arbeitsspeicher", "Netzteil", "Festplattenspeicher", "Grafikkarte", "Soundkarte", "Netzwerkkarte"])
                .map((name) => `<button type="button" draggable="true" class="part-card" data-part="${name}">${name}</button>`)
                .join("")}
            </div>
          </div>
        `;
        const parts = [...root.querySelectorAll(".part-card")];
        const slots = [...root.querySelectorAll(".slot")];
        setupPlaceInteraction(parts, slots, runtime.data, () => {
          const allFilled = slots.every((slot) => slot.dataset.filled === "1");
          if (allFilled) {
            setSpeech("Alle Bauteile rasten ein. Der Rechner ist zusammengebaut.");
            complete();
          } else {
            setFeedback("Bauteil rastet ein. Weiter so!", "ok");
          }
        }, () => {
          mistake("Dieses Bauteil passt dort nicht. Wähle den richtigen Einbauort.");
          setSpeech("Das Teil gehört an eine andere Stelle.");
        });
      },
      ({ root, runtime, complete, mistake }) => {
        const pairs = [
          ["Prozessor", "Gehirn"],
          ["Netzteil", "Herz"],
          ["Arbeitsspeicher", "Kurzzeitgedächtnis"],
          ["Festplattenspeicher", "Langzeitgedächtnis"],
          ["Grafikkarte", "Sehsinn"],
          ["Soundkarte", "Hörsinn"],
          ["Mainboard", "Skelett und Nervenbahnen"]
        ];
        if (!runtime.data.hardwareLinks) runtime.data.hardwareLinks = {};
        root.innerHTML = `
          ${createMissionTitle("Mission 3: Mensch und Computer", "Verbinde jede Komponente mit dem passenden Vergleich.")}
          <div class="match-columns">
            <div class="panel" id="hw-left">${pairs.map(([left]) => `<button type="button" class="tag" data-side="left" data-value="${left}">${left}</button>`).join("")}</div>
            <div class="panel" id="hw-right">${shuffle(pairs.map(([, right]) => right)).map((right) => `<button type="button" class="tag" data-side="right" data-value="${right}">${right}</button>`).join("")}</div>
          </div>
          <p><strong>Verbunden:</strong> <span id="hw-link-count">${Object.keys(runtime.data.hardwareLinks).length}</span>/${pairs.length}</p>
        `;
        let selectedLeft = null;
        root.querySelectorAll(".tag").forEach((button) => {
          const linked = runtime.data.hardwareLinks[button.dataset.value] || Object.values(runtime.data.hardwareLinks).includes(button.dataset.value);
          if (linked) button.classList.add("linked");
          button.addEventListener("click", () => {
            if (button.classList.contains("linked")) return;
            if (button.dataset.side === "left") {
              selectedLeft = button.dataset.value;
              setFeedback(`${selectedLeft} gewählt. Jetzt den passenden Vergleich wählen.`, "info");
              return;
            }
            if (!selectedLeft) {
              mistake("Wähle zuerst links eine Komponente aus.");
              return;
            }
            const isCorrect = pairs.some(([left, right]) => left === selectedLeft && right === button.dataset.value);
            if (!isCorrect) {
              mistake("Diese Zuordnung passt noch nicht. Nutze den Vergleich zwischen Computer und Mensch.");
              return;
            }
            runtime.data.hardwareLinks[selectedLeft] = button.dataset.value;
            LEVEL_RENDERERS.hardware[2]({ root, runtime, complete, mistake });
            if (Object.keys(runtime.data.hardwareLinks).length === pairs.length) {
              complete();
            }
          });
        });
      },
      ({ root, runtime, complete, mistake }) => {
        const cases = [
          { symptom: "Kein Strom", component: "Netzteil" },
          { symptom: "Kein Bild", component: "Grafikkarte" },
          { symptom: "Keine Netzwerkverbindung", component: "Netzwerkkarte" },
          { symptom: "Kurzfristige Daten nicht speicherbar", component: "Arbeitsspeicher" }
        ];
        if (!runtime.data.hwFix) runtime.data.hwFix = {};
        const open = cases.find((entry) => !runtime.data.hwFix[entry.symptom]);
        root.innerHTML = `
          ${createMissionTitle("Abschlussmission: Fehlerdiagnose", open ? `Aktueller Fehler: ${open.symptom}` : "Alle Fehler repariert")}
          <div class="mission-grid">
            <div class="panel">
              <div class="board">
                ${["Netzteil", "Grafikkarte", "Netzwerkkarte", "Arbeitsspeicher", "Prozessor", "Mainboard", "Festplattenspeicher", "Soundkarte"]
                  .map((name) => `<button type="button" class="diag-cell" data-component="${name}">${name}</button>`)
                  .join("")}
              </div>
            </div>
            <div class="panel">
              <h4>Fehlerliste</h4>
              ${cases.map((entry) => `<div class="incident ${runtime.data.hwFix[entry.symptom] ? "good" : ""}">${entry.symptom}</div>`).join("")}
              <p id="computer-state">${open ? "⚫ Computer ist aus" : "🟢 Computer startet sichtbar"}</p>
            </div>
          </div>
        `;
        root.querySelectorAll(".diag-cell").forEach((button) => {
          button.addEventListener("click", () => {
            if (!open) return;
            const chosen = button.dataset.component;
            if (chosen === open.component) {
              runtime.data.hwFix[open.symptom] = true;
              setSpeech(`${open.component} repariert. Nächsten Fehler prüfen.`);
              const done = cases.every((entry) => runtime.data.hwFix[entry.symptom]);
              if (done) {
                setSpeech("Alles repariert! Der Computer schaltet sich ein.");
                complete();
              } else {
                LEVEL_RENDERERS.hardware[3]({ root, runtime, complete, mistake });
              }
            } else {
              mistake("Das passt nicht zum aktuellen Fehler. Wähle das passende Bauteil.");
            }
          });
        });
      }
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

  function hardwareHint(part) {
    const hints = {
      Mainboard: "Das Mainboard verbindet alle Komponenten wie ein technisches Skelett.",
      Prozessor: "Der Prozessor verarbeitet Befehle wie ein Gehirn.",
      Arbeitsspeicher: "Der RAM hält kurzfristige Daten bereit.",
      Netzteil: "Das Netzteil liefert Energie für alle Teile.",
      Festplattenspeicher: "Die Festplatte speichert Daten langfristig.",
      Grafikkarte: "Die Grafikkarte ist für die Bildausgabe zuständig.",
      Soundkarte: "Die Soundkarte verarbeitet Audio-Ein- und Ausgabe.",
      Netzwerkkarte: "Die Netzwerkkarte verbindet den Rechner mit anderen Geräten."
    };
    return hints[part] || "";
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
