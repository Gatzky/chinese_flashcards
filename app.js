const STORAGE_KEY = "chinese-flashcards-v1";
const SESSION_SIZES = [5, 10, 20, 30, 50];

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
const newDeckName = document.getElementById("new-deck-name");
const newDeckBtn = document.getElementById("new-deck-btn");
const deleteDeckBtn = document.getElementById("delete-deck-btn");
const importAddBtn = document.getElementById("import-add-btn");
const importReplaceBtn = document.getElementById("import-replace-btn");
const importFile = document.getElementById("import-file");
const importStatus = document.getElementById("import-status");
const frontHint = document.getElementById("front-hint");
const sessionSizeSelect = document.getElementById("session-size");

let store = loadStore();
let deck = [];
let index = 0;
let flipped = false;
let known = [];
let unknown = [];
let importMode = "add";

function createId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return `deck-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function defaultStore() {
  const starterId = "starter";
  return {
    activeId: starterId,
    sessionSize: 10,
    decks: [
      { id: starterId, name: "Przykładowe znaki", cards: STARTER_CARDS.map(cloneCard) },
      { id: "moja-baza", name: "Moja baza", cards: [] },
    ],
  };
}

function cloneCard(card) {
  return {
    hanzi: card.hanzi,
    pinyin: card.pinyin,
    meaning: card.meaning,
    misses: card.misses || 0,
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
    if (!SESSION_SIZES.includes(parsed.sessionSize) && parsed.sessionSize !== 0) {
      parsed.sessionSize = 10;
    }
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

function parseTxt(text) {
  const cards = [];
  const skipped = [];

  text.split(/\r?\n/).forEach((line, lineIndex) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;

    const parts = trimmed.split("//").map((part) => part.trim());
    if (parts.length < 2 || !parts[0] || !parts[parts.length - 1]) {
      skipped.push(lineIndex + 1);
      return;
    }

    const hanzi = parts[0];
    const pinyin = parts.length === 2 ? "" : parts[1];
    const meaning = parts.length === 2 ? parts[1] : parts.slice(2).join(" // ");
    cards.push({ hanzi, pinyin, meaning });
  });

  return { cards, skipped };
}

function mergeCards(existing, incoming) {
  const byHanzi = new Map(existing.map((card) => [card.hanzi, cloneCard(card)]));
  incoming.forEach((card) => {
    const previous = byHanzi.get(card.hanzi);
    const next = cloneCard(card);
    if (previous) next.misses = previous.misses;
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
  const groups = new Map();
  cards.forEach((card) => {
    const key = card.misses || 0;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(cloneCard(card));
  });

  const ordered = [...groups.keys()]
    .sort((a, b) => b - a)
    .flatMap((key) => shuffle(groups.get(key)));

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

function setStatus(message) {
  importStatus.textContent = message;
}

function currentCard() {
  return deck[index];
}

function renderCard() {
  deckTitle.textContent = activeDeck().name;
  cardEl.classList.remove("is-flipped");
  flipped = false;

  if (!deck.length) {
    hanziEl.textContent = "空";
    hanziBackEl.textContent = "空";
    pinyinEl.textContent = "";
    meaningEl.textContent = "Baza jest pusta";
    frontHint.textContent = "Zaimportuj plik .txt, żeby dodać znaki";
    progressEl.textContent = "0 / 0";
    knownBtn.disabled = true;
    unknownBtn.disabled = true;
    cardEl.disabled = true;
    noteEl.textContent = "Wybierz inną bazę albo zaimportuj znaki.";
    return;
  }

  const card = currentCard();
  cardEl.disabled = false;
  hanziEl.textContent = card.hanzi;
  hanziBackEl.textContent = card.hanzi;
  pinyinEl.textContent = card.pinyin;
  meaningEl.textContent = card.meaning;
  frontHint.textContent = "Kliknij, żeby odwrócić";
  progressEl.textContent = `${index + 1} / ${deck.length}`;
  knownBtn.disabled = true;
  unknownBtn.disabled = true;
  noteEl.textContent = "Najpierw odwróć kartę, potem oceń, czy znasz znak.";
}

function flipCard() {
  if (!deck.length) return;
  flipped = !flipped;
  cardEl.classList.toggle("is-flipped", flipped);
  knownBtn.disabled = !flipped;
  unknownBtn.disabled = !flipped;
  noteEl.textContent = flipped
    ? "Czy umiesz ten znak?"
    : "Najpierw odwróć kartę, potem oceń, czy znasz znak.";
}

function recordMiss(card) {
  const stored = activeDeck().cards.find((item) => item.hanzi === card.hanzi);
  if (!stored) return;
  stored.misses = (stored.misses || 0) + 1;
  card.misses = stored.misses;
  saveStore();
}

function answer(isKnown) {
  if (!flipped || !deck.length) return;

  const card = currentCard();
  if (isKnown) known.push(card);
  else {
    recordMiss(card);
    unknown.push(card);
  }

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
  scoreEl.textContent = `Znasz ${known.length} z ${known.length + unknown.length} znaków.`;
  retryUnknownBtn.disabled = unknown.length === 0;
}

function startSession(cards) {
  deck = cards.map(cloneCard);
  index = 0;
  known = [];
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
  if (importMode === "replace") {
    current.cards = incoming.map(cloneCard);
  } else {
    current.cards = mergeCards(current.cards, incoming);
  }
  saveStore();

  const skippedNote = skipped.length ? ` Pominięto linie: ${skipped.join(", ")}.` : "";
  const action = importMode === "replace" ? "Nadpisano" : "Dodano do";
  setStatus(`${action} bazę „${current.name}”: ${current.cards.length} znaków.${skippedNote}`);
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

  const text = await file.text();
  const { cards, skipped } = parseTxt(text);
  if (!cards.length) {
    setStatus("Nie znaleziono poprawnych linii. Użyj formatu: znak // pinyin // tłumaczenie");
    return;
  }
  applyImport(cards, skipped);
});

cardEl.addEventListener("click", flipCard);
knownBtn.addEventListener("click", () => answer(true));
unknownBtn.addEventListener("click", () => answer(false));
restartBtn.addEventListener("click", startActiveDeck);
retryUnknownBtn.addEventListener("click", () => {
  if (unknown.length) startSession(unknown);
});

renderSessionSizeSelect();
startActiveDeck();
