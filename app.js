const STORAGE_KEY = "chinese-flashcards-v1";
const SESSION_SIZES = [10, 20, 50];

const STARTER_CARDS = [
  { hanzi: "你", pinyin: "nǐ", meaning: "ty" },
  { hanzi: "好", pinyin: "hǎo", meaning: "dobry" },
  { hanzi: "我", pinyin: "wǒ", meaning: "ja" },
  { hanzi: "是", pinyin: "shì", meaning: "być" },
  { hanzi: "中", pinyin: "zhōng", meaning: "środek / Chiny" },
  { hanzi: "国", pinyin: "guó", meaning: "kraj" },
  { hanzi: "人", pinyin: "rén", meaning: "człowiek" },
  { hanzi: "学", pinyin: "xué", meaning: "uczyć się" },
  { hanzi: "水", pinyin: "shuǐ", meaning: "woda" },
  { hanzi: "爱", pinyin: "ài", meaning: "miłość / kochać" },
];

const cardEl = document.getElementById("card");
const hanziEl = document.getElementById("hanzi");
const hanziBackEl = document.getElementById("hanzi-back");
const pinyinEl = document.getElementById("pinyin");
const meaningEl = document.getElementById("meaning");
const progressEl = document.getElementById("progress");
const knownBtn = document.getElementById("known-btn");
const unknownBtn = document.getElementById("unknown-btn");
const noteEl = document.getElementById("note");
const appEl = document.querySelector(".app");
const summaryEl = document.getElementById("summary");
const scoreEl = document.getElementById("score");
const retryUnknownBtn = document.getElementById("retry-unknown-btn");
const restartBtn = document.getElementById("restart-btn");
const deckSelect = document.getElementById("deck-select");
const deckTitle = document.getElementById("deck-title");
const studyModeSelect = document.getElementById("study-mode");
const tabButtons = [...document.querySelectorAll('[role="tab"]')];
const tabPanels = [...document.querySelectorAll('[role="tabpanel"]')];
const newDeckName = document.getElementById("new-deck-name");
const newDeckBtn = document.getElementById("new-deck-btn");
const deleteDeckBtn = document.getElementById("delete-deck-btn");
const importAddBtn = document.getElementById("import-add-btn");
const importReplaceBtn = document.getElementById("import-replace-btn");
const importFile = document.getElementById("import-file");
const importStatus = document.getElementById("import-status");
const frontHint = document.getElementById("front-hint");
const sessionSizeSelect = document.getElementById("session-size");
const statsKnownEl = document.getElementById("stats-known");
const statsUnseenEl = document.getElementById("stats-unseen");
const statsUnknownEl = document.getElementById("stats-unknown");
const phaseLabelEl = document.getElementById("phase-label");
const actionsEl = document.getElementById("actions");
const speakBtn = document.getElementById("speak-btn");
const sentenceTooltipEl = document.getElementById("sentence-tooltip");
const etymologyTooltipEl = document.getElementById("etymology-tooltip");
const detailsEl = document.getElementById("card-details");
const sentenceBtn = document.getElementById("sentence-btn");
const etymologyBtn = document.getElementById("etymology-btn");
const nextBtn = document.getElementById("next-btn");

let store = loadStore();
let deck = [];
let index = 0;
let phase = 0;
let knownAnswers = 0;
let unknownAnswers = 0;
let unknown = [];
let importMode = "add";
let speechRequestId = 0;

function createId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return `deck-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function defaultStore() {
  const starterId = "starter";
  return {
    activeId: starterId,
    sessionSize: 10,
    studyMode: "three",
    decks: [
      { id: starterId, name: "Przykładowe znaki", cards: STARTER_CARDS.map(cloneCard) },
      { id: "moja-baza", name: "Moja baza", cards: [] },
    ],
  };
}

function parseCardAnnotations(parts) {
  const values = { meaning: [], sentence: [], etymology: [] };
  let currentField = "meaning";

  parts.forEach((part) => {
    const chunks = String(part || "").split(/(\[sentence\]|\[etymology\]|\[characters meaning\])/gi);
    chunks.forEach((chunk) => {
      const marker = chunk.trim().toLowerCase();
      if (marker === "[sentence]") currentField = "sentence";
      else if (marker === "[etymology]" || marker === "[characters meaning]") currentField = "etymology";
      else if (chunk.trim()) values[currentField].push(chunk.trim());
    });
  });

  return {
    meaning: values.meaning.join(" // "),
    sentence: values.sentence.join(" // "),
    etymology: values.etymology.join(" // "),
  };
}

function cloneCard(card) {
  const annotations = parseCardAnnotations((card.meaning || "").split("//"));
  return {
    hanzi: card.hanzi,
    pinyin: card.pinyin,
    meaning: annotations.meaning,
    sentence: card.sentence || annotations.sentence,
    etymology: card.etymology || card.charactersMeaning || annotations.etymology,
    misses: Math.max(0, Number(card.misses) || 0),
    attempts: Math.max(0, Number(card.attempts) || 0),
  };
}

function loadStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultStore();
    const parsed = JSON.parse(raw);
    if (!parsed?.decks?.length) return defaultStore();
    if (!parsed.decks.some((deckItem) => deckItem.id === parsed.activeId)) {
      parsed.activeId = parsed.decks[0].id;
    }
    parsed.sessionSize = Number(parsed.sessionSize);
    if (![...SESSION_SIZES, 0].includes(parsed.sessionSize)) parsed.sessionSize = 10;
    parsed.studyMode = parsed.studyMode === "two" ? "two" : "three";
    parsed.decks.forEach((deckItem) => {
      deckItem.cards = (Array.isArray(deckItem.cards) ? deckItem.cards : []).map(cloneCard);
    });
    return parsed;
  } catch {
    return defaultStore();
  }
  studyModeSelect.value = store.studyMode;
}

function saveStore() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function activeDeck() {
  return store.decks.find((deckItem) => deckItem.id === store.activeId) || store.decks[0];
}

function parseJson(text) {
  const parsed = JSON.parse(text);
  const sourceCards = Array.isArray(parsed) ? parsed : parsed?.cards;
  if (!Array.isArray(sourceCards)) {
    throw new Error('Plik musi zawierać tablicę "cards".');
  }

  const cards = [];
  const skipped = [];

  sourceCards.forEach((card, index) => {
    if (!card || typeof card !== "object" || Array.isArray(card) ||
      typeof card.hanzi !== "string" || !card.hanzi.trim() ||
      typeof card.meaning !== "string" || !card.meaning.trim()) {
      skipped.push(index + 1);
      return;
    }

    cards.push({
      hanzi: card.hanzi.trim(),
      pinyin: typeof card.pinyin === "string" ? card.pinyin.trim() : "",
      meaning: card.meaning.trim(),
      sentence: typeof card.sentence === "string" ? card.sentence.trim() : "",
      etymology: typeof card.etymology === "string"
        ? card.etymology.trim()
        : typeof card.charactersMeaning === "string" ? card.charactersMeaning.trim() : "",
    });
  });

  return { cards, skipped };
}

function mergeCards(existing, incoming) {
  const byHanzi = new Map(existing.map((card) => [card.hanzi, cloneCard(card)]));
  incoming.forEach((card) => {
    const previous = byHanzi.get(card.hanzi);
    const next = cloneCard(card);
    if (previous) {
      next.misses = previous.misses;
      next.attempts = previous.attempts;
    }
    byHanzi.set(card.hanzi, next);
  });
  return [...byHanzi.values()];
}

function replaceCardsPreservingProgress(existing, incoming) {
  const byHanzi = new Map(existing.map((card) => [card.hanzi, card]));
  let preserved = 0;
  const cards = incoming.map((card) => {
    const next = cloneCard(card);
    const previous = byHanzi.get(card.hanzi);
    if (previous) {
      next.misses = previous.misses;
      next.attempts = previous.attempts;
      preserved += 1;
    }
    return next;
  });
  return { cards, preserved };
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickSessionCards(cards, size) {
  const unseen = shuffle(cards.filter((card) => !card.misses && !card.attempts));
  const easy = shuffle(cards.filter((card) => !card.misses && card.attempts > 0));
  const hardGroups = new Map();
  cards.filter((card) => card.misses > 0).forEach((card) => {
    if (!hardGroups.has(card.misses)) hardGroups.set(card.misses, []);
    hardGroups.get(card.misses).push(card);
  });

  const ordered = [
    ...unseen,
    ...[...hardGroups.keys()]
      .sort((a, b) => b - a)
      .flatMap((key) => shuffle(hardGroups.get(key))),
    ...easy,
  ].map(cloneCard);

  if (!size || size >= ordered.length) return ordered;
  return ordered.slice(0, size);
}

function renderSessionSizeSelect() {
  sessionSizeSelect.innerHTML = "";
  SESSION_SIZES.forEach((size) => {
    const option = document.createElement("option");
    option.value = String(size);
    option.textContent = String(size);
    sessionSizeSelect.appendChild(option);
  });
  const allOption = document.createElement("option");
  allOption.value = "0";
  allOption.textContent = "Wszystkie";
  sessionSizeSelect.appendChild(allOption);
  sessionSizeSelect.value = String(store.sessionSize ?? 10);
}

function renderDeckSelect() {
  deckSelect.innerHTML = "";
  store.decks.forEach((deckItem) => {
    const option = document.createElement("option");
    option.value = deckItem.id;
    option.textContent = `${deckItem.name} (${deckItem.cards.length})`;
    if (deckItem.id === store.activeId) option.selected = true;
    deckSelect.appendChild(option);
  });
  deleteDeckBtn.disabled = store.decks.length <= 1;
}

function renderStats() {
  const cards = activeDeck().cards;
  const knownCount = cards.filter((card) => card.attempts > 0 && !card.misses).length;
  const unseenCount = cards.filter((card) => !card.attempts && !card.misses).length;
  const unknownCount = cards.filter((card) => card.misses > 0).length;
  statsKnownEl.textContent = String(knownCount);
  statsUnseenEl.textContent = String(unseenCount);
  statsUnknownEl.textContent = String(unknownCount);
}

function setStatus(message) {
  importStatus.textContent = message;
}

function currentCard() {
  return deck[index];
}

function updateCardTools(card) {
  speakBtn.disabled = !card || !("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window);
  sentenceBtn.disabled = !card?.sentence;
  etymologyBtn.disabled = !card?.etymology;
  sentenceTooltipEl.textContent = card?.sentence || "";
  etymologyTooltipEl.textContent = card?.etymology || "";
  sentenceBtn.setAttribute("aria-expanded", "false");
  etymologyBtn.setAttribute("aria-expanded", "false");
  speakBtn.classList.remove("is-speaking");
}

function toggleCardTooltip(button) {
  const willExpand = button.getAttribute("aria-expanded") !== "true";
  sentenceBtn.setAttribute("aria-expanded", "false");
  etymologyBtn.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-expanded", String(willExpand));
}

function renderCard() {
  speechRequestId += 1;
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  deckTitle.textContent = activeDeck().name;
  cardEl.classList.add("is-changing");
  void cardEl.offsetWidth;
  cardEl.classList.remove("is-flipped");
  phase = 0;
  renderStats();
  actionsEl.hidden = false;
  updateCardTools(null);
  detailsEl.hidden = true;

  if (!deck.length) {
    hanziEl.textContent = "空";
    hanziBackEl.textContent = "空";
    pinyinEl.textContent = "";
    meaningEl.textContent = "Baza jest pusta";
    frontHint.textContent = "Zaimportuj plik .json, żeby dodać znaki";
    progressEl.textContent = "0 / 0";
    knownBtn.disabled = true;
    unknownBtn.disabled = true;
    cardEl.disabled = true;
    pinyinEl.hidden = true;
    meaningEl.hidden = true;
    noteEl.textContent = "Wybierz inną bazę albo zaimportuj znaki.";
    window.setTimeout(() => cardEl.classList.remove("is-changing"), 0);
    return;
  }

  const card = currentCard();
  updateCardTools(card);
  cardEl.disabled = false;
  hanziEl.textContent = card.hanzi;
  hanziBackEl.textContent = card.hanzi;
  pinyinEl.textContent = card.pinyin;
  meaningEl.textContent = card.meaning;
  pinyinEl.hidden = true;
  meaningEl.hidden = true;
  phaseLabelEl.textContent = store.studyMode === "two" ? "Pinyin + tłumaczenie" : "Pinyin";
  frontHint.textContent = "Kliknij, żeby odsłonić pinyin";
  progressEl.textContent = `${index + 1} / ${deck.length} · znak`;
  knownBtn.disabled = true;
  unknownBtn.disabled = true;
  noteEl.textContent = "Najpierw spróbuj odczytać znak.";
  window.setTimeout(() => cardEl.classList.remove("is-changing"), 0);
}

function flipCard() {
  if (!deck.length || phase !== 0) return;
  phase = 1;
  cardEl.classList.add("is-flipped");
  cardEl.disabled = true;
  pinyinEl.hidden = false;
  meaningEl.hidden = store.studyMode !== "two";
  phaseLabelEl.textContent = "Pinyin";
  if (store.studyMode === "two") {
    phaseLabelEl.textContent = "Pinyin + tłumaczenie";
    progressEl.textContent = `${index + 1} / ${deck.length} · pinyin + tłumaczenie`;
  } else {
    progressEl.textContent = `${index + 1} / ${deck.length} · pinyin`;
  }
  knownBtn.disabled = false;
  unknownBtn.disabled = false;
  noteEl.textContent = store.studyMode === "two"
    ? "Czy znasz pinyin i tłumaczenie tego słowa?"
    : "Czy znasz pinyin tego znaku?";
  speakCard(currentCard().hanzi);
}

function speakCard(hanzi) {
  if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) return;
  const requestId = ++speechRequestId;
  window.speechSynthesis.cancel();
  speakBtn.classList.remove("is-speaking");
  const utterance = new SpeechSynthesisUtterance(hanzi);
  utterance.lang = "zh-CN";
  utterance.rate = 0.9;
  const clearSpeakingState = () => {
    if (requestId === speechRequestId) speakBtn.classList.remove("is-speaking");
  };
  utterance.onstart = () => {
    if (requestId === speechRequestId) speakBtn.classList.add("is-speaking");
  };
  utterance.onend = clearSpeakingState;
  utterance.onerror = clearSpeakingState;
  window.speechSynthesis.speak(utterance);
}

function recordMiss(card) {
  const stored = activeDeck().cards.find((item) => item.hanzi === card.hanzi);
  if (!stored) return;
  stored.misses = (stored.misses || 0) + 1;
  stored.attempts = (stored.attempts || 0) + 1;
  card.misses = stored.misses;
  card.attempts = stored.attempts;
  saveStore();
  renderStats();
}

function recordKnown(card) {
  const stored = activeDeck().cards.find((item) => item.hanzi === card.hanzi);
  if (!stored) return;
  stored.misses = Math.max(0, (stored.misses || 0) - 2);
  stored.attempts = (stored.attempts || 0) + 1;
  card.misses = stored.misses;
  card.attempts = stored.attempts;
  saveStore();
  renderStats();
}

function answer(isKnown) {
  if ((phase !== 1 && phase !== 2) || !deck.length) return;

  const card = currentCard();
  if (isKnown) {
    recordKnown(card);
    knownAnswers += 1;
  }
  else {
    recordMiss(card);
    unknownAnswers += 1;
    if (!unknown.some((item) => item.hanzi === card.hanzi)) unknown.push(card);
  }

  if (phase === 1 && store.studyMode === "three") {
    phase = 2;
    pinyinEl.hidden = true;
    meaningEl.hidden = false;
    phaseLabelEl.textContent = "Tłumaczenie";
    progressEl.textContent = `${index + 1} / ${deck.length} · tłumaczenie`;
    noteEl.textContent = "Czy znasz tłumaczenie tego słowa?";
    knownBtn.disabled = true;
    unknownBtn.disabled = true;
    window.setTimeout(() => {
      if (phase === 2) {
        knownBtn.disabled = false;
        unknownBtn.disabled = false;
      }
    }, 300);
    return;
  }

  showCardDetails();
}

function showCardDetails() {
  phase = 3;
  actionsEl.hidden = true;
  const card = currentCard();
  const hasDetails = Boolean(card.sentence || card.etymology);
  if (!hasDetails) {
    advanceCard();
    return;
  }

  detailsEl.hidden = false;
  nextBtn.textContent = index + 1 === deck.length ? "Zakończ sesję" : "Następna";
  noteEl.textContent = "Zobacz dodatkowe informacje albo przejdź dalej.";
}

function advanceCard() {
  detailsEl.hidden = true;
  index += 1;
  if (index >= deck.length) {
    showSummary();
    return;
  }

  renderCard();
}

function showSummary() {
  appEl.classList.add("hidden");
  summaryEl.classList.remove("hidden");
  summaryEl.hidden = false;
  scoreEl.textContent = `Poprawne odpowiedzi: ${knownAnswers} z ${knownAnswers + unknownAnswers}.`;
  retryUnknownBtn.disabled = unknown.length === 0;
}

function startSession(cards) {
  deck = shuffle(cards).map(cloneCard);
  index = 0;
  phase = 0;
  knownAnswers = 0;
  unknownAnswers = 0;
  unknown = [];
  appEl.classList.remove("hidden");
  summaryEl.classList.add("hidden");
  summaryEl.hidden = true;
  renderDeckSelect();
  renderCard();
}

function startActiveDeck() {
  startSession(pickSessionCards(activeDeck().cards, store.sessionSize));
}

function createDeck() {
  const name = newDeckName.value.trim();
  if (!name) {
    setStatus("Podaj nazwę nowej bazy.");
    return;
  }

  const deckItem = { id: createId(), name, cards: [] };
  store.decks.push(deckItem);
  store.activeId = deckItem.id;
  newDeckName.value = "";
  saveStore();
  setStatus(`Utworzono bazę „${name}”.`);
  startActiveDeck();
}

function deleteActiveDeck() {
  if (store.decks.length <= 1) return;
  const name = activeDeck().name;
  if (!confirm(`Usunąć bazę „${name}”?`)) return;
  store.decks = store.decks.filter((deckItem) => deckItem.id !== store.activeId);
  store.activeId = store.decks[0].id;
  saveStore();
  setStatus(`Usunięto bazę „${name}”.`);
  startActiveDeck();
}

function applyImport(incoming, skipped) {
  const current = activeDeck();
  let preserved = 0;
  if (importMode === "replace") {
    const replacement = replaceCardsPreservingProgress(current.cards, incoming);
    current.cards = replacement.cards;
    preserved = replacement.preserved;
  } else {
    current.cards = mergeCards(current.cards, incoming);
  }
  saveStore();

  const skippedNote = skipped.length ? ` Pominięto linie: ${skipped.join(", ")}.` : "";
  const action = importMode === "replace" ? "Nadpisano" : "Dodano do";
  const preservedNote = importMode === "replace" ? ` Zachowano postęp dla ${preserved} pasujących znaków.` : "";
  setStatus(`${action} bazę „${current.name}”: ${current.cards.length} znaków.${preservedNote}${skippedNote}`);
  startActiveDeck();
}

function chooseImport(mode) {
  importMode = mode;
  importFile.value = "";
  importFile.click();
}

deckSelect.addEventListener("change", () => {
  store.activeId = deckSelect.value;
  saveStore();
  setStatus("");
  startActiveDeck();
});

sessionSizeSelect.addEventListener("change", () => {
  store.sessionSize = Number(sessionSizeSelect.value);
  saveStore();
  startActiveDeck();
});

studyModeSelect.addEventListener("change", () => {
  store.studyMode = studyModeSelect.value === "two" ? "two" : "three";
  saveStore();
  startActiveDeck();
});

function activateTab(tabName, focusTab = false) {
  tabButtons.forEach((button) => {
    const isActive = button.dataset.tab === tabName;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
    button.tabIndex = isActive ? 0 : -1;
    if (isActive && focusTab) button.focus();
  });
  tabPanels.forEach((panel) => {
    panel.hidden = panel.id !== `${tabName}-panel`;
  });
}

tabButtons.forEach((button, index) => {
  button.addEventListener("click", () => activateTab(button.dataset.tab));
  button.addEventListener("keydown", (event) => {
    let nextIndex = index;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % tabButtons.length;
    else if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabButtons.length) % tabButtons.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = tabButtons.length - 1;
    else return;
    event.preventDefault();
    activateTab(tabButtons[nextIndex].dataset.tab, true);
  });
});

newDeckBtn.addEventListener("click", createDeck);
newDeckName.addEventListener("keydown", (event) => {
  if (event.key === "Enter") createDeck();
});
deleteDeckBtn.addEventListener("click", deleteActiveDeck);
importAddBtn.addEventListener("click", () => chooseImport("add"));
importReplaceBtn.addEventListener("click", () => chooseImport("replace"));

importFile.addEventListener("change", async () => {
  const file = importFile.files[0];
  if (!file) return;

  try {
    const { cards, skipped } = parseJson(await file.text());
    if (!cards.length) {
      setStatus('Nie znaleziono poprawnych kart. Sprawdź tablicę "cards" oraz pola "hanzi" i "meaning".');
      return;
    }
    applyImport(cards, skipped);
  } catch (error) {
    setStatus(`Nie udało się odczytać JSON: ${error.message}`);
  }
});

cardEl.addEventListener("click", flipCard);
speakBtn.addEventListener("click", () => speakCard(currentCard().hanzi));
sentenceBtn.addEventListener("click", () => toggleCardTooltip(sentenceBtn));
etymologyBtn.addEventListener("click", () => toggleCardTooltip(etymologyBtn));
knownBtn.addEventListener("click", () => answer(true));
unknownBtn.addEventListener("click", () => answer(false));
nextBtn.addEventListener("click", advanceCard);
restartBtn.addEventListener("click", startActiveDeck);
retryUnknownBtn.addEventListener("click", () => {
  if (unknown.length) startSession(unknown);
});

renderSessionSizeSelect();
startActiveDeck();
