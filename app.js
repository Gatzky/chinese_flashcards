const STORAGE_KEY = "chinese-flashcards-v1";
const SESSION_SIZES = [10, 20, 50];

const STARTER_CARDS = [
  { hanzi: "你", pinyin: "nǐ", meaning: "you" },
  { hanzi: "好", pinyin: "hǎo", meaning: "good" },
  { hanzi: "我", pinyin: "wǒ", meaning: "I" },
  { hanzi: "是", pinyin: "shì", meaning: "to be" },
  { hanzi: "中", pinyin: "zhōng", meaning: "middle / China" },
  { hanzi: "国", pinyin: "guó", meaning: "country" },
  { hanzi: "人", pinyin: "rén", meaning: "person" },
  { hanzi: "学", pinyin: "xué", meaning: "to study" },
  { hanzi: "水", pinyin: "shuǐ", meaning: "water" },
  { hanzi: "爱", pinyin: "ài", meaning: "love / to love" },
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
const deckListEl = document.getElementById("deck-list");
const wordListEl = document.getElementById("word-list");
const wordCountEl = document.getElementById("word-count");
const deckTitle = document.getElementById("deck-title");
const studyModeSelect = document.getElementById("study-mode");
const tabButtons = [...document.querySelectorAll('[role="tab"]')];
const tabPanels = [...document.querySelectorAll('[role="tabpanel"]')];
const newDeckName = document.getElementById("new-deck-name");
const newDeckForm = document.getElementById("new-deck-form");
const deleteDeckBtn = document.getElementById("delete-deck-btn");
const importAddBtn = document.getElementById("import-add-btn");
const importFile = document.getElementById("import-file");
const importStatus = document.getElementById("import-status");
const wordForm = document.getElementById("word-form");
const wordHanziInput = document.getElementById("word-hanzi");
const wordPinyinInput = document.getElementById("word-pinyin");
const wordMeaningInput = document.getElementById("word-meaning");
const wordSentenceInput = document.getElementById("word-sentence");
const wordEtymologyInput = document.getElementById("word-etymology");
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
      { id: starterId, name: "Sample characters", cards: STARTER_CARDS.map(cloneCard) },
      { id: "my-deck", name: "My deck", cards: [] },
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
      if (deckItem.id === "starter" && deckItem.name === "Przykładowe znaki") {
        deckItem.name = "Sample characters";
      } else if (deckItem.id === "moja-baza" && deckItem.name === "Moja baza") {
        deckItem.name = "My deck";
      }
      deckItem.cards = (Array.isArray(deckItem.cards) ? deckItem.cards : []).map(cloneCard);
    });
    return parsed;
  } catch {
    return defaultStore();
  }
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
    throw new Error('The file must contain a "cards" array.');
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
  allOption.textContent = "All";
  sessionSizeSelect.appendChild(allOption);
  sessionSizeSelect.value = String(store.sessionSize ?? 10);
}

function renderDeckList() {
  deckListEl.innerHTML = "";
  store.decks.forEach((deckItem) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "deck-option";
    button.classList.toggle("is-active", deckItem.id === store.activeId);
    button.setAttribute("aria-pressed", String(deckItem.id === store.activeId));

    const name = document.createElement("span");
    name.className = "deck-option-name";
    name.textContent = deckItem.name;

    const count = document.createElement("span");
    count.className = "deck-option-count";
    count.textContent = String(deckItem.cards.length);

    button.append(name, count);
    button.addEventListener("click", () => {
      store.activeId = deckItem.id;
      saveStore();
      setStatus("");
      startActiveDeck();
    });
    deckListEl.appendChild(button);
  });
  deleteDeckBtn.disabled = store.decks.length <= 1;
}

function renderWordList() {
  const cards = activeDeck().cards;
  wordCountEl.textContent = `${cards.length} ${cards.length === 1 ? "word" : "words"}`;
  wordListEl.innerHTML = "";

  if (!cards.length) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "word-list-empty";
    emptyItem.textContent = "This deck has no words yet.";
    wordListEl.appendChild(emptyItem);
    return;
  }

  cards.forEach((card) => {
    const item = document.createElement("li");
    item.className = "word-item";

    const details = document.createElement("div");
    details.className = "word-item-details";

    const hanzi = document.createElement("strong");
    hanzi.className = "word-item-hanzi";
    hanzi.textContent = card.hanzi;

    const meaning = document.createElement("span");
    meaning.className = "word-item-meaning";
    meaning.textContent = [card.pinyin, card.meaning].filter(Boolean).join(" · ");
    details.append(hanzi, meaning);

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "btn btn-no btn-small remove-word-btn";
    removeButton.textContent = "Remove";
    removeButton.setAttribute("aria-label", `Remove ${card.hanzi} from this deck`);
    removeButton.addEventListener("click", () => removeWord(card.hanzi));

    item.append(details, removeButton);
    wordListEl.appendChild(item);
  });
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
    meaningEl.textContent = "This deck is empty";
    frontHint.textContent = "Import a .json file to add cards";
    progressEl.textContent = "0 / 0";
    knownBtn.disabled = true;
    unknownBtn.disabled = true;
    cardEl.disabled = true;
    pinyinEl.hidden = true;
    meaningEl.hidden = true;
    noteEl.textContent = "Choose another deck or import cards.";
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
  phaseLabelEl.textContent = store.studyMode === "two" ? "Pinyin + meaning" : "Pinyin";
  frontHint.textContent = "Click to reveal pinyin";
  progressEl.textContent = `${index + 1} / ${deck.length} · character`;
  knownBtn.disabled = true;
  unknownBtn.disabled = true;
  noteEl.textContent = "Try to read the character first.";
  window.setTimeout(() => cardEl.classList.remove("is-changing"), 0);
}

function flipCard() {
  if (!deck.length || phase !== 0) return;
  phase = 1;
  cardEl.classList.add("is-flipped");
  cardEl.disabled = true;
  pinyinEl.hidden = false;
  meaningEl.hidden = store.studyMode !== "two";
  phaseLabelEl.textContent = store.studyMode === "two" ? "Pinyin + meaning" : "Pinyin";
  if (store.studyMode === "two") {
    progressEl.textContent = `${index + 1} / ${deck.length} · pinyin + meaning`;
  } else {
    progressEl.textContent = `${index + 1} / ${deck.length} · pinyin`;
  }
  knownBtn.disabled = false;
  unknownBtn.disabled = false;
  noteEl.textContent = store.studyMode === "two"
    ? "Do you know the pinyin and meaning?"
    : "Do you know the pinyin?";
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
    phaseLabelEl.textContent = "Meaning";
    progressEl.textContent = `${index + 1} / ${deck.length} · meaning`;
    noteEl.textContent = "Do you know the meaning?";
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
  nextBtn.textContent = index + 1 === deck.length ? "Finish session" : "Next";
  noteEl.textContent = "Review the extra details or continue.";
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
  scoreEl.textContent = `Correct answers: ${knownAnswers} of ${knownAnswers + unknownAnswers}.`;
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
  renderDeckList();
  renderWordList();
  renderCard();
}

function startActiveDeck() {
  startSession(pickSessionCards(activeDeck().cards, store.sessionSize));
}

function createDeck() {
  const name = newDeckName.value.trim();
  if (!name) {
    setStatus("Enter a name for the new deck.");
    return;
  }

  const deckItem = { id: createId(), name, cards: [] };
  store.decks.push(deckItem);
  store.activeId = deckItem.id;
  newDeckName.value = "";
  saveStore();
  setStatus(`Created deck "${name}".`);
  startActiveDeck();
}

function addWord(event) {
  event.preventDefault();
  const card = {
    hanzi: wordHanziInput.value.trim(),
    pinyin: wordPinyinInput.value.trim(),
    meaning: wordMeaningInput.value.trim(),
    sentence: wordSentenceInput.value.trim(),
    etymology: wordEtymologyInput.value.trim(),
  };
  if (!card.hanzi || !card.meaning) return;

  const isUpdate = activeDeck().cards.some((item) => item.hanzi === card.hanzi);
  activeDeck().cards = mergeCards(activeDeck().cards, [card]);
  saveStore();
  setStatus(`${isUpdate ? "Updated" : "Added"} "${card.hanzi}" in "${activeDeck().name}".`);
  wordForm.reset();
  startActiveDeck();
}

function removeWord(hanzi) {
  const current = activeDeck();
  if (!confirm(`Remove "${hanzi}" from "${current.name}"?`)) return;
  current.cards = current.cards.filter((card) => card.hanzi !== hanzi);
  saveStore();
  setStatus(`Removed "${hanzi}" from "${current.name}".`);
  startActiveDeck();
}

function deleteActiveDeck() {
  if (store.decks.length <= 1) return;
  const name = activeDeck().name;
  if (!confirm(`Delete deck "${name}"?`)) return;
  store.decks = store.decks.filter((deckItem) => deckItem.id !== store.activeId);
  store.activeId = store.decks[0].id;
  saveStore();
  setStatus(`Deleted deck "${name}".`);
  startActiveDeck();
}

function applyImport(incoming, skipped) {
  const current = activeDeck();
  current.cards = mergeCards(current.cards, incoming);
  saveStore();

  const skippedNote = skipped.length ? ` Skipped entries: ${skipped.join(", ")}.` : "";
  setStatus(`Imported ${incoming.length} cards into "${current.name}".${skippedNote}`);
  startActiveDeck();
}

function chooseImport() {
  importFile.value = "";
  importFile.click();
}

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

newDeckForm.addEventListener("submit", (event) => {
  event.preventDefault();
  createDeck();
});
wordForm.addEventListener("submit", addWord);
deleteDeckBtn.addEventListener("click", deleteActiveDeck);
importAddBtn.addEventListener("click", chooseImport);

importFile.addEventListener("change", async () => {
  const file = importFile.files[0];
  if (!file) return;

  try {
    const { cards, skipped } = parseJson(await file.text());
    if (!cards.length) {
      setStatus('No valid cards found. Check the "cards" array and required "hanzi" and "meaning" fields.');
      return;
    }
    applyImport(cards, skipped);
  } catch (error) {
    setStatus(`Could not read JSON: ${error.message}`);
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
studyModeSelect.value = store.studyMode;
startActiveDeck();
