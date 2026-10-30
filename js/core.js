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
const renameDeckActionBtn = document.getElementById("rename-deck-action");
const deleteDeckActionBtn = document.getElementById("delete-deck-action");
const showWordsActionBtn = document.getElementById("show-words-action");
const deckOptionsDialog = document.getElementById("deck-options-dialog");
const closeDeckOptionsBtn = document.getElementById("close-deck-options-btn");
const wordsDialog = document.getElementById("words-dialog");
const closeWordsDialogBtn = document.getElementById("close-words-dialog-btn");
const studyModeSelect = document.getElementById("study-mode");
const tabButtons = [...document.querySelectorAll('[role="tab"]')];
const tabPanels = [...document.querySelectorAll('[role="tabpanel"]')];
const newDeckName = document.getElementById("new-deck-name");
const newDeckForm = document.getElementById("new-deck-form");
const renameDeckForm = document.getElementById("rename-deck-form");
const renameDeckName = document.getElementById("rename-deck-name");
const renameDeckDialog = document.getElementById("rename-deck-dialog");
const closeRenameDialogBtn = document.getElementById("close-rename-dialog-btn");
const cancelRenameBtn = document.getElementById("cancel-rename-btn");
const importAddBtn = document.getElementById("import-add-btn");
const importFile = document.getElementById("import-file");
const importDialog = document.getElementById("import-dialog");
const importFileName = document.getElementById("import-file-name");
const importAnalysis = document.getElementById("import-analysis");
const selectImportFileBtn = document.getElementById("select-import-file-btn");
const confirmImportBtn = document.getElementById("confirm-import-btn");
const cancelImportBtn = document.getElementById("cancel-import-btn");
const closeImportBtn = document.getElementById("close-import-btn");
const importDestination = document.getElementById("import-destination");
const importTarget = document.getElementById("import-target");
const importTargetField = document.getElementById("import-target-field");
const importNameField = document.getElementById("import-name-field");
const importDeckName = document.getElementById("import-deck-name");
const exportDeckBtn = document.getElementById("export-deck-btn");
const importStatus = document.getElementById("import-status");
const feedbackDialog = document.getElementById("feedback-dialog");
const feedbackForm = document.getElementById("feedback-form");
const feedbackType = document.getElementById("feedback-type");
const feedbackDescription = document.getElementById("feedback-description");
const openFeedbackBtn = document.getElementById("open-feedback-btn");
const closeFeedbackBtn = document.getElementById("close-feedback-btn");
const cancelFeedbackBtn = document.getElementById("cancel-feedback-btn");
const accountStatusEl = document.getElementById("account-status");
const accountSyncOverlay = document.getElementById("account-sync-overlay");
const accountAuthView = document.getElementById("account-auth-view");
const accountProfile = document.getElementById("account-profile");
const accountForm = document.getElementById("account-form");
const accountEmailInput = document.getElementById("account-email");
const accountPasswordInput = document.getElementById("account-password");
const accountPasswordHint = document.getElementById("account-password-hint");
const accountPasswordConfirm = document.getElementById("account-password-confirm");
const confirmPasswordField = document.getElementById("confirm-password-field");
const authModeButtons = [...document.querySelectorAll("[data-auth-mode]")];
const accountSubmitBtn = document.getElementById("account-submit-btn");
const passwordResetBtn = document.getElementById("password-reset-btn");
const accountUserEmail = document.getElementById("account-user-email");
const cloudSyncStatusEl = document.getElementById("cloud-sync-status");
const profilePasswordResetBtn = document.getElementById("profile-password-reset-btn");
const signOutBtn = document.getElementById("sign-out-btn");
const wordDialog = document.getElementById("word-dialog");
const wordForm = document.getElementById("word-form");
const wordHanziInput = document.getElementById("word-hanzi");
const wordPinyinInput = document.getElementById("word-pinyin");
const wordMeaningInput = document.getElementById("word-meaning");
const wordSentenceInput = document.getElementById("word-sentence");
const wordEtymologyInput = document.getElementById("word-etymology");
const wordFormTitle = document.getElementById("word-form-title");
const wordSaveBtn = document.getElementById("word-save-btn");
const showWordFormBtn = document.getElementById("show-word-form-btn");
const wordCancelBtn = document.getElementById("word-cancel-btn");
const frontHint = document.getElementById("front-hint");
const sessionSizeSelect = document.getElementById("session-size");
const autoplaySelect = document.getElementById("autoplay-pronunciation");
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
let editingHanzi = "";
let pendingImport = null;
let firebaseAuth = null;
let firebaseAuthApi = null;
let firebaseDb = null;
let firebaseFirestoreApi = null;
let signedInUser = null;
let cloudSyncReady = false;
let cloudWriteQueue = Promise.resolve();
let authMode = "signin";
let authChangeId = 0;

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
    autoPlayPronunciation: true,
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

function normalizeStore(parsed) {
  if (!parsed?.decks?.length) throw new Error("Invalid deck data.");
  const normalized = { ...parsed };
  if (!normalized.decks.some((deckItem) => deckItem.id === normalized.activeId)) {
    normalized.activeId = normalized.decks[0].id;
  }
  normalized.sessionSize = Number(normalized.sessionSize);
  if (![...SESSION_SIZES, 0].includes(normalized.sessionSize)) normalized.sessionSize = 10;
  normalized.studyMode = normalized.studyMode === "two" ? "two" : "three";
  normalized.autoPlayPronunciation = normalized.autoPlayPronunciation !== false;
  normalized.decks = normalized.decks.map((deckItem) => {
    const normalizedDeck = { ...deckItem };
    if (normalizedDeck.id === "starter" && normalizedDeck.name === "Przykładowe znaki") {
      normalizedDeck.name = "Sample characters";
    } else if (normalizedDeck.id === "moja-baza" && normalizedDeck.name === "Moja baza") {
      normalizedDeck.name = "My deck";
    }
    normalizedDeck.cards = (Array.isArray(normalizedDeck.cards) ? normalizedDeck.cards : []).map(cloneCard);
    return normalizedDeck;
  });
  return normalized;
}

function loadStore(storageKey = STORAGE_KEY) {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return defaultStore();
    return normalizeStore(JSON.parse(raw));
  } catch {
    return defaultStore();
  }
}

function saveStore() {
  const serialized = JSON.stringify(store);
  localStorage.setItem(signedInUser ? `${STORAGE_KEY}:user:${signedInUser.uid}` : STORAGE_KEY, serialized);
  if (!signedInUser || !cloudSyncReady || !firebaseDb || !firebaseFirestoreApi) return;

  const user = signedInUser;
  const snapshot = JSON.parse(serialized);
  const { doc, serverTimestamp, setDoc } = firebaseFirestoreApi;
  cloudWriteQueue = cloudWriteQueue
    .catch(() => {})
    .then(() => setDoc(doc(firebaseDb, "users", user.uid, "appData", "main"), {
      store: snapshot,
      updatedAt: serverTimestamp(),
    }))
    .then(() => {
      if (signedInUser?.uid === user.uid) cloudSyncStatusEl.textContent = "All decks are synced.";
    })
    .catch((error) => {
      if (signedInUser?.uid === user.uid) {
        cloudSyncStatusEl.textContent = `Saved on this device. Cloud sync failed: ${error.message}`;
      }
    });
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

  return { cards, skipped, total: sourceCards.length };
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

function mergeStores(cloudStore, localStore) {
  const merged = normalizeStore(JSON.parse(JSON.stringify(cloudStore)));
  const local = normalizeStore(JSON.parse(JSON.stringify(localStore)));

  local.decks.forEach((localDeck) => {
    const cloudDeck = merged.decks.find((deckItem) => deckItem.id === localDeck.id);
    if (cloudDeck) {
      cloudDeck.name = localDeck.name;
      cloudDeck.cards = mergeCards(cloudDeck.cards, localDeck.cards);
    } else {
      merged.decks.push({ ...localDeck, cards: localDeck.cards.map(cloneCard) });
    }
  });

  merged.activeId = local.activeId;
  merged.sessionSize = local.sessionSize;
  merged.studyMode = local.studyMode;
  merged.autoPlayPronunciation = local.autoPlayPronunciation;
  return normalizeStore(merged);
}

