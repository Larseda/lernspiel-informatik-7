(function () {
  "use strict";

  const STORAGE_KEY = "systemretter7-progress-v1";
  const LEVELS = window.LEVELS || [];
  const BASE_POINTS = 10;
  const FIRST_TRY_BONUS = 5;
  const NO_HINT_BONUS = 3;

  const state = loadState();
  wireUi();
  ensureCurrentLevelSelection();
  renderAll();

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
    LEVELS.forEach((level, idx) => {
      levelStates[level.id] = {
        outcome: "pending",
        bestPoints: 0,
        bestStars: 0,
        currentStep: 0,
        currentRun: createEmptyRun(level.id)
      };
      if (idx === 0) {
        levelStates[level.id].outcome = "pending";
      }
    });
    return {
      selectedLevelId: LEVELS[0] ? LEVELS[0].id : null,
      levelStates
    };
  }

  function createEmptyRun(levelId) {
    const level = LEVELS.find((entry) => entry.id === levelId);
    const solved = {};
    const attempts = {};
    const hintsUsed = {};
    const explanationsUsed = {};
    level.steps.forEach((step) => {
      solved[step.id] = !isInteractive(step);
      attempts[step.id] = 0;
      hintsUsed[step.id] = false;
      explanationsUsed[step.id] = false;
    });
    return {
      solved,
      attempts,
      hintsUsed,
      explanationsUsed,
      score: 0,
      completed: false
    };
  }

  function migrateState(existing) {
    const fallback = createDefaultState();
    if (!existing.levelStates) return fallback;

    LEVELS.forEach((level) => {
      if (!existing.levelStates[level.id]) {
        existing.levelStates[level.id] = fallback.levelStates[level.id];
      }
      const levelState = existing.levelStates[level.id];
      if (!["pending", "completed", "skipped"].includes(levelState.outcome)) {
        levelState.outcome = "pending";
      }
      if (typeof levelState.bestPoints !== "number") levelState.bestPoints = 0;
      if (typeof levelState.bestStars !== "number") levelState.bestStars = 0;
      if (typeof levelState.currentStep !== "number") levelState.currentStep = 0;
      if (!levelState.currentRun || typeof levelState.currentRun !== "object") {
        levelState.currentRun = createEmptyRun(level.id);
      }
      const run = levelState.currentRun;
      if (!run.solved) run.solved = {};
      if (!run.attempts) run.attempts = {};
      if (!run.hintsUsed) run.hintsUsed = {};
      if (!run.explanationsUsed) run.explanationsUsed = {};
      if (typeof run.score !== "number") run.score = 0;
      if (typeof run.completed !== "boolean") run.completed = false;
      level.steps.forEach((step) => {
        if (typeof run.solved[step.id] !== "boolean") run.solved[step.id] = !isInteractive(step);
        if (typeof run.attempts[step.id] !== "number") run.attempts[step.id] = 0;
        if (typeof run.hintsUsed[step.id] !== "boolean") run.hintsUsed[step.id] = false;
        if (typeof run.explanationsUsed[step.id] !== "boolean") run.explanationsUsed[step.id] = false;
      });
    });

    if (!LEVELS.some((level) => level.id === existing.selectedLevelId)) {
      existing.selectedLevelId = LEVELS[0].id;
    }
    return existing;
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function wireUi() {
    $("#prev-step-btn").addEventListener("click", goToPreviousStep);
    $("#next-step-btn").addEventListener("click", goToNextStep);
    $("#check-btn").addEventListener("click", checkCurrentStep);
    $("#hint-btn").addEventListener("click", showHint);
    $("#explain-btn").addEventListener("click", showExplanation);
    $("#restart-level-btn").addEventListener("click", restartCurrentLevel);
    $("#skip-level-btn").addEventListener("click", skipCurrentLevel);
    $("#reset-progress-btn").addEventListener("click", resetProgress);
  }

  function ensureCurrentLevelSelection() {
    if (!state.selectedLevelId || !state.levelStates[state.selectedLevelId]) {
      state.selectedLevelId = LEVELS[0].id;
    }
  }

  function getSelectedLevel() {
    return LEVELS.find((level) => level.id === state.selectedLevelId) || LEVELS[0];
  }

  function getLevelState(levelId) {
    return state.levelStates[levelId];
  }

  function renderAll() {
    renderProgressBar();
    renderStats();
    renderLevelStep();
    renderFinalScreen();
    saveState();
  }

  function renderProgressBar() {
    const list = $("#level-progress");
    list.innerHTML = "";
    const highestUnlocked = getHighestUnlockedIndex();
    LEVELS.forEach((level, idx) => {
      const levelState = getLevelState(level.id);
      const isCurrent = state.selectedLevelId === level.id;
      const outcomeClass = isCurrent ? "current" : levelState.outcome;
      const statusMeta = getStatusMeta(levelState.outcome, isCurrent);
      const li = document.createElement("li");
      li.className = `progress-item ${outcomeClass}`;
      const isUnlocked = idx <= highestUnlocked || levelState.outcome !== "pending";

      const button = document.createElement("button");
      button.type = "button";
      button.disabled = !isUnlocked;
      button.setAttribute("aria-current", isCurrent ? "step" : "false");
      button.innerHTML = `<strong>${idx + 1}. ${shortTitle(level.title)}</strong><span class="status">${statusMeta}</span>`;
      button.addEventListener("click", () => {
        state.selectedLevelId = level.id;
        renderAll();
      });
      li.appendChild(button);
      list.appendChild(li);
    });
  }

  function getStatusMeta(outcome, isCurrent) {
    if (isCurrent) return "▶ Aktuell geöffnet";
    if (outcome === "completed") return "✓ Abgeschlossen";
    if (outcome === "skipped") return "⤼ Übersprungen";
    return "○ Noch offen";
  }

  function shortTitle(full) {
    return full.replace(/^Level \d+:\s*/i, "");
  }

  function getHighestUnlockedIndex() {
    let unlock = 0;
    for (let i = 0; i < LEVELS.length; i += 1) {
      const levelState = getLevelState(LEVELS[i].id);
      if (levelState.outcome === "completed" || levelState.outcome === "skipped") {
        unlock = i + 1;
      } else {
        break;
      }
    }
    return Math.min(unlock, LEVELS.length - 1);
  }

  function renderStats() {
    const selected = getSelectedLevel();
    const totals = getTotals();
    $("#current-level-label").textContent = selected ? selected.title : "–";
    $("#overall-progress").textContent = `${totals.progressPercent}%`;
    $("#total-points").textContent = String(totals.points);
    $("#total-stars").textContent = String(totals.stars);
    $("#completed-count").textContent = String(totals.completed);
    $("#skipped-count").textContent = String(totals.skipped);
  }

  function getTotals() {
    let points = 0;
    let stars = 0;
    let completed = 0;
    let skipped = 0;
    LEVELS.forEach((level) => {
      const levelState = getLevelState(level.id);
      points += levelState.bestPoints;
      stars += levelState.bestStars;
      if (levelState.outcome === "completed") completed += 1;
      if (levelState.outcome === "skipped") skipped += 1;
    });
    const doneLike = completed + skipped;
    const progressPercent = Math.round((doneLike / LEVELS.length) * 100);
    return { points, stars, completed, skipped, progressPercent };
  }

  function renderLevelStep() {
    const level = getSelectedLevel();
    if (!level) return;
    const levelState = getLevelState(level.id);
    const stepIndex = clamp(levelState.currentStep, 0, level.steps.length - 1);
    levelState.currentStep = stepIndex;
    const step = level.steps[stepIndex];

    $("#level-title").textContent = level.title;
    $("#step-title").textContent = `Schritt ${stepIndex + 1}/${level.steps.length}: ${step.title}`;
    $("#step-description").textContent = step.description || step.prompt || "";
    $("#mascot-message").textContent = buildMascotMessage(level, step);
    setFeedback("", "info");

    const container = $("#activity-container");
    container.innerHTML = "";
    renderStepActivity(step, container, levelState);

    const canCheck = isInteractive(step);
    $("#check-btn").disabled = !canCheck;
    $("#hint-btn").disabled = !canCheck;
    $("#explain-btn").classList.add("hidden");
    $("#explain-btn").disabled = true;

    if (canCheck && levelState.currentRun.attempts[step.id] >= 2) {
      $("#explain-btn").classList.remove("hidden");
      $("#explain-btn").disabled = false;
    }

    $("#prev-step-btn").disabled = stepIndex === 0;
    $("#next-step-btn").disabled = !levelState.currentRun.solved[step.id];
  }

  function buildMascotMessage(level, step) {
    if (step.type === "intro") return `${level.mascotIntro} Lies den Abschnitt und klicke dann auf Weiter.`;
    if (step.type === "summary") return "Großartig! Das war der Abschluss dieses Levels.";
    return "Ich begleite dich. Nutze Hinweise, wenn du sie brauchst – Lernen geht Schritt für Schritt.";
  }

  function renderStepActivity(step, container, levelState) {
    switch (step.type) {
      case "intro":
      case "info":
      case "summary":
        container.innerHTML = `<p>${escapeHtml(step.description || "")}</p>`;
        break;
      case "quiz":
        renderQuiz(step, container);
        break;
      case "match":
        renderMatch(step, container);
        break;
      case "sort":
        renderSort(step, container, levelState);
        break;
      case "categorize":
        renderCategorize(step, container);
        break;
      case "bits":
        renderBits(step, container, levelState);
        break;
      case "fill":
        renderFill(step, container);
        break;
      default:
        container.innerHTML = "<p>Für diesen Schritt ist noch kein Renderer hinterlegt.</p>";
    }
  }

  function renderQuiz(step, container) {
    const fieldset = document.createElement("fieldset");
    fieldset.innerHTML = `<legend>${escapeHtml(step.question)}</legend>`;
    step.options.forEach((option, index) => {
      const id = `${step.id}-opt-${index}`;
      const row = document.createElement("div");
      row.innerHTML = `
        <input type="radio" name="${step.id}-radio" id="${id}" value="${index}">
        <label for="${id}">${escapeHtml(option)}</label>
      `;
      fieldset.appendChild(row);
    });
    container.appendChild(fieldset);
  }

  function renderMatch(step, container) {
    const wrapper = document.createElement("div");
    wrapper.className = "match-grid";
    const choices = step.pairs.map((entry) => entry.right);
    step.pairs.forEach((pair, idx) => {
      const row = document.createElement("div");
      row.className = "match-row";
      const label = document.createElement("label");
      const select = document.createElement("select");
      select.id = `${step.id}-match-${idx}`;
      label.setAttribute("for", select.id);
      label.textContent = pair.left;
      select.innerHTML = `<option value="">Bitte wählen</option>` +
        choices.map((choice) => `<option value="${escapeHtml(choice)}">${escapeHtml(choice)}</option>`).join("");
      row.appendChild(label);
      row.appendChild(select);
      wrapper.appendChild(row);
    });
    container.appendChild(wrapper);
  }

  function renderSort(step, container, levelState) {
    const orderKey = `${step.id}-sort-order`;
    const run = levelState.currentRun;
    if (!run[orderKey]) {
      run[orderKey] = [...step.items];
    }
    const list = document.createElement("ol");
    list.className = "sort-list";
    list.id = `${step.id}-sort-list`;
    run[orderKey].forEach((item, idx) => {
      list.appendChild(createSortItem(step, run, orderKey, idx, item));
    });
    container.appendChild(list);
  }

  function createSortItem(step, run, orderKey, idx, itemText) {
    const li = document.createElement("li");
    li.className = "sort-item";
    li.draggable = true;
    li.dataset.index = String(idx);
    li.innerHTML = `
      <span>${escapeHtml(itemText)}</span>
      <span class="sort-controls">
        <button type="button" data-action="up" aria-label="Element nach oben">↑</button>
        <button type="button" data-action="down" aria-label="Element nach unten">↓</button>
      </span>
    `;

    li.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        const action = btn.dataset.action;
        const arr = run[orderKey];
        const current = Number(li.dataset.index);
        if (action === "up" && current > 0) {
          [arr[current - 1], arr[current]] = [arr[current], arr[current - 1]];
        } else if (action === "down" && current < arr.length - 1) {
          [arr[current + 1], arr[current]] = [arr[current], arr[current + 1]];
        }
        renderAll();
      });
    });

    li.addEventListener("dragstart", (event) => {
      li.classList.add("dragging");
      event.dataTransfer.setData("text/plain", li.dataset.index);
    });
    li.addEventListener("dragend", () => li.classList.remove("dragging"));
    li.addEventListener("dragover", (event) => event.preventDefault());
    li.addEventListener("drop", (event) => {
      event.preventDefault();
      const from = Number(event.dataTransfer.getData("text/plain"));
      const to = Number(li.dataset.index);
      if (Number.isNaN(from) || Number.isNaN(to) || from === to) return;
      const arr = run[orderKey];
      const [moved] = arr.splice(from, 1);
      arr.splice(to, 0, moved);
      renderAll();
    });

    return li;
  }

  function renderCategorize(step, container) {
    const wrapper = document.createElement("div");
    wrapper.className = "categorize-grid";
    step.items.forEach((item, idx) => {
      const row = document.createElement("div");
      row.className = "categorize-row";
      const label = document.createElement("label");
      label.setAttribute("for", `${step.id}-cat-${idx}`);
      label.textContent = item.label;
      const select = document.createElement("select");
      select.id = `${step.id}-cat-${idx}`;
      select.innerHTML = `<option value="">Bitte wählen</option>` +
        step.categories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join("");
      row.appendChild(label);
      row.appendChild(select);
      wrapper.appendChild(row);
    });
    container.appendChild(wrapper);
  }

  function renderBits(step, container, levelState) {
    const key = `${step.id}-bits`;
    const run = levelState.currentRun;
    if (!run[key]) run[key] = Array.from(step.targetBits).map(() => "0");

    const grid = document.createElement("div");
    grid.className = "bit-grid";
    run[key].forEach((value, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `bit-btn ${value === "1" ? "on" : ""}`;
      btn.textContent = value;
      btn.setAttribute("aria-label", `Bit ${idx + 1}: ${value}`);
      btn.addEventListener("click", () => {
        run[key][idx] = run[key][idx] === "0" ? "1" : "0";
        renderAll();
      });
      grid.appendChild(btn);
    });
    const text = document.createElement("p");
    text.textContent = `Aktuelles Byte: ${run[key].join("")}`;
    container.appendChild(grid);
    container.appendChild(text);
  }

  function renderFill(step, container) {
    step.fields.forEach((field) => {
      const row = document.createElement("div");
      row.className = "fill-row";
      row.innerHTML = `
        <label for="${step.id}-${field.id}">${escapeHtml(field.label)}</label>
        <input id="${step.id}-${field.id}" type="text" autocomplete="off">
      `;
      container.appendChild(row);
    });
  }

  function checkCurrentStep() {
    const level = getSelectedLevel();
    const levelState = getLevelState(level.id);
    const step = level.steps[levelState.currentStep];
    if (!isInteractive(step)) return;

    const run = levelState.currentRun;
    run.attempts[step.id] += 1;

    const result = validateStep(step, levelState);
    if (result.correct) {
      run.solved[step.id] = true;
      addStepScore(step, run);
      setFeedback(`✅ ${result.message}`, "ok");
      $("#next-step-btn").disabled = false;
      $("#explain-btn").classList.add("hidden");
      $("#explain-btn").disabled = true;
      $("#mascot-message").textContent = "Stark! Genau so aktivierst du das Systemmodul.";
    } else {
      const attempts = run.attempts[step.id];
      const extra = attempts >= 2 ? " Du kannst jetzt auch „Lösung erklären“ nutzen." : "";
      setFeedback(`🧭 Noch nicht ganz. ${result.message}${extra}`, "warn");
      $("#mascot-message").textContent = "Kein Problem, Fehler sind Teil des Lernens. Versuch es nochmal.";
      if (attempts >= 2) {
        $("#explain-btn").classList.remove("hidden");
        $("#explain-btn").disabled = false;
      }
    }
    renderStats();
    saveState();
  }

  function addStepScore(step, run) {
    if (run.solved[`scored-${step.id}`]) return;
    const attempts = run.attempts[step.id];
    const usedHint = run.hintsUsed[step.id];
    let gained = BASE_POINTS;
    if (attempts === 1) gained += FIRST_TRY_BONUS;
    if (!usedHint) gained += NO_HINT_BONUS;
    run.score += gained;
    run.solved[`scored-${step.id}`] = true;
  }

  function validateStep(step, levelState) {
    switch (step.type) {
      case "quiz": {
        const selected = document.querySelector(`input[name="${step.id}-radio"]:checked`);
        if (!selected) return { correct: false, message: "Wähle bitte zuerst eine Antwort aus." };
        const isCorrect = Number(selected.value) === step.correctIndex;
        return {
          correct: isCorrect,
          message: isCorrect ? step.correctFeedback : (step.hint || "Überlege die zentrale Regel noch einmal."),
          explanation: step.correctFeedback
        };
      }
      case "match": {
        const allCorrect = step.pairs.every((pair, idx) => {
          const value = $(`#${step.id}-match-${idx}`).value;
          return normalize(value) === normalize(pair.right);
        });
        return {
          correct: allCorrect,
          message: allCorrect ? "Alle Zuordnungen stimmen." : (step.hint || "Prüfe die Zuordnungen erneut.")
        };
      }
      case "sort": {
        const arr = levelState.currentRun[`${step.id}-sort-order`] || [];
        const sameLength = arr.length === step.expectedOrder.length;
        const allCorrect = sameLength && arr.every((entry, idx) => entry === step.expectedOrder[idx]);
        return {
          correct: allCorrect,
          message: allCorrect ? "Reihenfolge korrekt." : (step.hint || "Bringe die Elemente in die logische Abfolge.")
        };
      }
      case "categorize": {
        const allCorrect = step.items.every((item, idx) => {
          const value = $(`#${step.id}-cat-${idx}`).value;
          return normalize(value) === normalize(item.category);
        });
        return {
          correct: allCorrect,
          message: allCorrect ? "Alle Kategorien passen." : (step.hint || "Prüfe die Kategorien noch einmal.")
        };
      }
      case "bits": {
        const currentBits = (levelState.currentRun[`${step.id}-bits`] || []).join("");
        const allCorrect = currentBits === step.targetBits;
        return {
          correct: allCorrect,
          message: allCorrect ? "Byte korrekt eingestellt." : (step.hint || "Vergleiche jede Bitposition genau.")
        };
      }
      case "fill": {
        const allCorrect = step.fields.every((field) => {
          const value = normalize($(`#${step.id}-${field.id}`).value);
          if (step.allowAlternatives && step.allowAlternatives[field.id]) {
            return step.allowAlternatives[field.id].some((entry) => normalize(entry) === value);
          }
          return value === normalize(field.expected);
        });
        if (allCorrect && step.allowAlternatives) {
          const uniqueValues = step.fields.map((field) => normalize($(`#${step.id}-${field.id}`).value));
          const hasDuplicates = new Set(uniqueValues).size !== uniqueValues.length;
          if (hasDuplicates) {
            return {
              correct: false,
              message: "Nutze zwei unterschiedliche Methoden, damit das Klassendiagramm vollständig ist."
            };
          }
        }
        return {
          correct: allCorrect,
          message: allCorrect ? "Eingaben stimmen." : (step.hint || "Prüfe die Begriffe sorgfältig.")
        };
      }
      default:
        return { correct: true, message: "Dieser Schritt ist abgeschlossen." };
    }
  }

  function goToPreviousStep() {
    const level = getSelectedLevel();
    const levelState = getLevelState(level.id);
    if (levelState.currentStep > 0) {
      levelState.currentStep -= 1;
      renderAll();
    }
  }

  function goToNextStep() {
    const level = getSelectedLevel();
    const levelState = getLevelState(level.id);
    const step = level.steps[levelState.currentStep];

    if (!levelState.currentRun.solved[step.id]) {
      setFeedback("Löse zuerst diesen Schritt oder nutze „Level überspringen“.", "warn");
      return;
    }

    if (levelState.currentStep < level.steps.length - 1) {
      levelState.currentStep += 1;
      renderAll();
      return;
    }

    completeLevel(level.id);
    renderAll();
  }

  function completeLevel(levelId) {
    const level = LEVELS.find((entry) => entry.id === levelId);
    const levelState = getLevelState(level.id);
    const run = levelState.currentRun;
    const max = maxPointsForLevel(level);
    const stars = calculateStars(run.score, max);

    if (run.score > levelState.bestPoints) {
      levelState.bestPoints = run.score;
    }
    if (stars > levelState.bestStars) {
      levelState.bestStars = stars;
    }
    levelState.outcome = "completed";
    run.completed = true;

    const nextIndex = LEVELS.findIndex((entry) => entry.id === levelId) + 1;
    if (nextIndex < LEVELS.length) {
      const next = LEVELS[nextIndex];
      state.selectedLevelId = next.id;
      const nextState = getLevelState(next.id);
      if (nextState.currentRun.completed || nextState.currentRun.score > 0) {
        nextState.currentRun = createEmptyRun(next.id);
      }
      nextState.currentStep = 0;
      if (nextState.outcome === "pending") {
        nextState.outcome = "pending";
      }
    }
    setFeedback(`Level abgeschlossen! Du hast in diesem Durchlauf ${run.score} Punkte und ${stars} Sterne erreicht.`, "ok");
    $("#mascot-message").textContent = "Gratulation! Ein weiterer Systembereich ist repariert.";
  }

  function maxPointsForLevel(level) {
    const interactiveCount = level.steps.filter((step) => isInteractive(step)).length;
    return interactiveCount * (BASE_POINTS + FIRST_TRY_BONUS + NO_HINT_BONUS);
  }

  function calculateStars(points, maxPoints) {
    if (maxPoints <= 0 || points <= 0) return 0;
    const ratio = points / maxPoints;
    if (ratio >= 0.9) return 3;
    if (ratio >= 0.65) return 2;
    return 1;
  }

  function showHint() {
    const level = getSelectedLevel();
    const levelState = getLevelState(level.id);
    const step = level.steps[levelState.currentStep];
    if (!isInteractive(step)) return;
    levelState.currentRun.hintsUsed[step.id] = true;
    const hint = step.hint || "Tipp: Gehe die Aufgabe Schritt für Schritt durch.";
    setFeedback(`💡 Hinweis: ${hint}`, "info");
    $("#mascot-message").textContent = "Gut gefragt! Nutze den Hinweis und probiere es erneut.";
    saveState();
  }

  function showExplanation() {
    const level = getSelectedLevel();
    const levelState = getLevelState(level.id);
    const step = level.steps[levelState.currentStep];
    levelState.currentRun.hintsUsed[step.id] = true;
    levelState.currentRun.explanationsUsed[step.id] = true;
    const explanation = getExplanation(step);
    setFeedback(`🧠 Erklärung: ${explanation}`, "info");
    saveState();
  }

  function getExplanation(step) {
    if (step.type === "quiz") return step.correctFeedback || "Die richtige Option erfüllt die Fachregel.";
    if (step.type === "match") return "Vergleiche jede linke Seite mit der fachlich passenden rechten Aussage.";
    if (step.type === "sort") return `Die korrekte Reihenfolge lautet: ${step.expectedOrder.join(" → ")}.`;
    if (step.type === "categorize") return "Jedes Element gehört genau zu einer Kategorie mit gleicher fachlicher Bedeutung.";
    if (step.type === "bits") return `Die Zielkombination ist ${step.targetBits}.`;
    if (step.type === "fill") {
      return "Übernimm die fachlich korrekten Begriffe/Werte exakt und achte auf Name und Endung.";
    }
    return "Nutze den Fachinhalt und den Hinweis, um die Aufgabe korrekt zu lösen.";
  }

  function skipCurrentLevel() {
    const confirmText = "Dieses Level wird als übersprungen markiert. Du kannst es später nachholen.";
    const ok = window.confirm(confirmText);
    if (!ok) return;

    const level = getSelectedLevel();
    const levelState = getLevelState(level.id);
    if (levelState.outcome !== "completed") {
      levelState.outcome = "skipped";
    }
    levelState.currentStep = 0;
    levelState.currentRun = createEmptyRun(level.id);

    const currentIndex = LEVELS.findIndex((entry) => entry.id === level.id);
    if (currentIndex < LEVELS.length - 1) {
      state.selectedLevelId = LEVELS[currentIndex + 1].id;
    }
    renderAll();
  }

  function restartCurrentLevel() {
    const level = getSelectedLevel();
    const ok = window.confirm("Möchtest du dieses Level neu starten? Bisherige Bestwerte bleiben erhalten.");
    if (!ok) return;
    const levelState = getLevelState(level.id);
    levelState.currentRun = createEmptyRun(level.id);
    levelState.currentStep = 0;
    renderAll();
  }

  function setFeedback(message, tone) {
    const feedback = $("#feedback");
    feedback.textContent = message;
    feedback.className = `feedback ${tone || "info"}`;
  }

  function resetProgress() {
    const ok = window.confirm("Möchtest du den gesamten Lernfortschritt wirklich zurücksetzen?");
    if (!ok) return;
    const fresh = createDefaultState();
    state.selectedLevelId = fresh.selectedLevelId;
    state.levelStates = fresh.levelStates;
    renderAll();
  }

  function renderFinalScreen() {
    const final = $("#final-screen");
    const totals = getTotals();
    const allDone = LEVELS.every((level) => {
      const outcome = getLevelState(level.id).outcome;
      return outcome === "completed" || outcome === "skipped";
    });
    if (!allDone) {
      final.classList.add("hidden");
      final.innerHTML = "";
      return;
    }

    const skippedLevels = LEVELS.filter((level) => getLevelState(level.id).outcome === "skipped");
    const completedAll = LEVELS.every((level) => getLevelState(level.id).outcome === "completed");
    final.classList.remove("hidden");

    const skippedList = skippedLevels.length
      ? `<p><strong>Übersprungene Level:</strong> ${skippedLevels.map((level) => shortTitle(level.title)).join(", ")}</p>
         <button id="retry-skipped-btn" type="button">Übersprungene Level nachholen</button>`
      : "<p><strong>Übersprungene Level:</strong> keine</p>";

    final.innerHTML = `
      <h3>Abschlussansicht</h3>
      <p><strong>Gesamtfortschritt:</strong> ${totals.progressPercent}%</p>
      <p><strong>Punkte:</strong> ${totals.points} | <strong>Sterne:</strong> ${totals.stars}</p>
      <p><strong>Abgeschlossene Level:</strong> ${totals.completed}</p>
      ${skippedList}
      ${completedAll ? `
      <div class="system-online">
        <p>✅ Computersystem vollständig aktiviert!</p>
        <span class="badge" aria-label="Digitales Abzeichen">🏅 Abzeichen: Systemretter*in Klasse 7</span>
      </div>
      ` : "<p>Du kannst jetzt die gelben Level direkt nachholen.</p>"}
    `;

    const retryBtn = document.getElementById("retry-skipped-btn");
    if (retryBtn) {
      retryBtn.addEventListener("click", () => {
        const firstSkipped = skippedLevels[0];
        if (!firstSkipped) return;
        state.selectedLevelId = firstSkipped.id;
        const ls = getLevelState(firstSkipped.id);
        ls.currentRun = createEmptyRun(firstSkipped.id);
        ls.currentStep = 0;
        renderAll();
      });
    }
  }

  function isInteractive(step) {
    return !["intro", "info", "summary"].includes(step.type);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll("\"", "&quot;")
      .replaceAll("'", "&#39;");
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function normalize(value) {
    return String(value || "").trim().toLowerCase().replaceAll(/\s+/g, " ");
  }

  function $(selector) {
    return document.querySelector(selector);
  }
})();
