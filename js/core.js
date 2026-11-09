const STORAGE_KEY = "chinese-flashcards-v1";
const DEFAULT_DECKS_VERSION = 4;

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
const summaryPreviousBtn = document.getElementById("summary-previous-btn");
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
const studyModeButtons = [...document.querySelectorAll("[data-study-mode-option]")];
const sessionSizeInput = document.getElementById("session-size");
const sessionModeButtons = [...document.querySelectorAll("[data-session-mode-option]")];
const sessionSizeControl = document.getElementById("session-size-control");
const autoplayButtons = [...document.querySelectorAll("[data-autoplay-option]")];
const themeButtons = [...document.querySelectorAll("[data-theme-option]")];
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
const feedbackStatusEl = document.getElementById("feedback-status");
const feedbackSubmitBtn = document.getElementById("feedback-submit-btn");
const openFeedbackBtn = document.getElementById("open-feedback-btn");
const closeFeedbackBtn = document.getElementById("close-feedback-btn");
const cancelFeedbackBtn = document.getElementById("cancel-feedback-btn");
const openFeedbackInboxBtn = document.getElementById("open-feedback-inbox-btn");
const feedbackInboxDialog = document.getElementById("feedback-inbox-dialog");
const closeFeedbackInboxBtn = document.getElementById("close-feedback-inbox-btn");
const feedbackInboxStatusEl = document.getElementById("feedback-inbox-status");
const feedbackListEl = document.getElementById("feedback-list");
const accountStatusEl = document.getElementById("account-status");
const accountSyncOverlay = document.getElementById("account-sync-overlay");
const accountAuthView = document.getElementById("account-auth-view");
const accountProfile = document.getElementById("account-profile");
const accountForm = document.getElementById("account-form");
const accountEmailInput = document.getElementById("account-email");
const accountPasswordInput = document.getElementById("account-password");
const accountPasswordHint = document.getElementById("account-password-hint");
const passwordSecurityNote = document.getElementById("password-security-note");
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
const statsKnownEl = document.getElementById("stats-known");
const statsUnseenEl = document.getElementById("stats-unseen");
const statsPerfectEl = document.getElementById("stats-perfect");
const statsUnsureEl = document.getElementById("stats-unsure");
const statsNoIdeaEl = document.getElementById("stats-no-idea");
const phaseLabelEl = document.getElementById("phase-label");
const actionsEl = document.getElementById("actions");
const speakBtn = document.getElementById("speak-btn");
const sentenceTooltipEl = document.getElementById("sentence-tooltip");
const etymologyTooltipEl = document.getElementById("etymology-tooltip");
const detailsEl = document.getElementById("card-details");
const previousBtn = document.getElementById("previous-btn");
const previousDetailsBtn = document.getElementById("previous-details-btn");
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
let answerHistory = [];
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
  return {
    activeId: "starter",
    studyAllDecks: false,
    sessionSize: 10,
    sessionMode: "count",
    studyMode: "three",
    autoPlayPronunciation: true,
    theme: "black",
    defaultDecksVersion: DEFAULT_DECKS_VERSION,
    decks: [
      ...window.HSK_DECKS.map((deckItem) => ({
        ...deckItem,
        cards: deckItem.cards.map(cloneCard),
      })),
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

function masteryForScore(score, attempts) {
  if (attempts === 0 && score === 0) return 0;
  if (score <= -3) return 1;
  if (score <= 0) return 2;
  if (score >= 3) return 4;
  return 3;
}

function masteryScoreForCard(card) {
  if (Number.isInteger(card.masteryScore) && card.masteryScore >= -4 && card.masteryScore <= 4) {
    return card.masteryScore;
  }
  if (Number.isInteger(card.mastery) && card.mastery >= 0 && card.mastery <= 4) {
    return [0, -3, -1, 2, 3][card.mastery];
  }
  if (Number(card.attempts) > 0) {
    return Number(card.misses) > 0 ? -Math.min(3, Number(card.misses)) : 2;
  }
  return 0;
}

function cloneCard(card) {
  const annotations = parseCardAnnotations((card.meaning || "").split("//"));
  const attempts = Math.max(0, Number(card.attempts) || 0);
  const misses = Math.min(4, Math.max(0, Number(card.misses) || 0));
  const masteryScore = masteryScoreForCard(card);
  return {
    hanzi: card.hanzi,
    pinyin: card.pinyin,
    meaning: annotations.meaning,
    sentence: card.sentence || annotations.sentence,
    sentenceSource: card.sentenceSource || "",
    etymology: card.etymology || card.charactersMeaning || annotations.etymology,
    etymologySource: card.etymologySource || "",
    misses,
    attempts,
    masteryScore,
    mastery: masteryForScore(masteryScore, attempts),
  };
}

function cloneStudyCard(card) {
  const copy = cloneCard(card);
  if (Array.isArray(card.sourceDeckIds)) copy.sourceDeckIds = [...card.sourceDeckIds];
  return copy;
}

function allDeckCards() {
  const cardsByHanzi = new Map();
  store.decks.forEach((deckItem) => {
    deckItem.cards.forEach((card) => {
      const existing = cardsByHanzi.get(card.hanzi);
      if (!existing) {
        cardsByHanzi.set(card.hanzi, {
          ...cloneCard(card),
          sourceDeckIds: [deckItem.id],
        });
        return;
      }

      if (!existing.sourceDeckIds.includes(deckItem.id)) existing.sourceDeckIds.push(deckItem.id);
      existing.masteryScore = Math.min(existing.masteryScore, card.masteryScore);
      existing.mastery = masteryForScore(existing.masteryScore, Math.max(existing.attempts, card.attempts));
      existing.misses = Math.max(existing.misses, card.misses);
      existing.attempts = Math.max(existing.attempts, card.attempts);
    });
  });
  return [...cardsByHanzi.values()];
}

function deduplicateCards(cards) {
  const cardsByHanzi = new Map();
  cards.forEach((card) => {
    const previous = cardsByHanzi.get(card.hanzi);
    if (!previous) {
      cardsByHanzi.set(card.hanzi, cloneCard(card));
      return;
    }

    const duplicate = cloneCard(card);
    duplicate.attempts += previous.attempts;
    duplicate.misses += previous.misses;
    duplicate.masteryScore = Math.min(duplicate.masteryScore, previous.masteryScore);
    duplicate.mastery = masteryForScore(duplicate.masteryScore, duplicate.attempts);
    cardsByHanzi.set(card.hanzi, duplicate);
  });
  return [...cardsByHanzi.values()];
}

function normalizeStore(parsed) {
  if (!parsed?.decks?.length) throw new Error("Invalid deck data.");
  const normalized = { ...parsed };
  if (!normalized.decks.some((deckItem) => deckItem.id === normalized.activeId)) {
    normalized.activeId = normalized.decks[0].id;
  }
  normalized.sessionSize = Number(normalized.sessionSize);
  if (!Number.isSafeInteger(normalized.sessionSize) || normalized.sessionSize < 0) normalized.sessionSize = 10;
  normalized.sessionMode = ["count", "all", "unseen", "needs-practice", "unseen-and-needs-practice"].includes(normalized.sessionMode)
    ? normalized.sessionMode
    : normalized.sessionSize === 0 ? "all" : "count";
  normalized.studyAllDecks = normalized.studyAllDecks === true;
  normalized.studyMode = normalized.studyMode === "two" ? "two" : "three";
  normalized.autoPlayPronunciation = normalized.autoPlayPronunciation !== false;
  normalized.theme = normalized.theme === "light" ? "light" : "black";
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

  if ((Number(normalized.defaultDecksVersion) || 0) < DEFAULT_DECKS_VERSION) {
    window.HSK_DECKS.forEach((defaultDeck) => {
      const existingDeck = normalized.decks.find((deckItem) => deckItem.id === defaultDeck.id);
      if (!existingDeck) {
        normalized.decks.push({
          ...defaultDeck,
          cards: defaultDeck.cards.map(cloneCard),
        });
        return;
      }

      const previousCards = new Map(deduplicateCards(existingDeck.cards).map((card) => [card.hanzi, card]));
      const standardCards = defaultDeck.cards.map((card) => {
        const previous = previousCards.get(card.hanzi);
        return {
          ...cloneCard(card),
          attempts: previous?.attempts || 0,
          misses: previous?.misses || 0,
          mastery: previous?.mastery ?? 0,
          masteryScore: previous?.masteryScore ?? card.masteryScore,
        };
      });
      const standardHanzi = new Set(defaultDeck.cards.map((card) => card.hanzi));
      const customCards = deduplicateCards(existingDeck.cards)
        .filter((card) => !standardHanzi.has(card.hanzi));
      if (defaultDeck.id === "starter" && existingDeck.name === "Sample characters") {
        existingDeck.name = defaultDeck.name;
      }
      existingDeck.cards = [...standardCards, ...customCards];
    });
    normalized.defaultDecksVersion = DEFAULT_DECKS_VERSION;
  }

  return normalized;
}

function loadStore(storageKey = STORAGE_KEY) {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return defaultStore();
    const parsed = JSON.parse(raw);
    return normalizeStore(parsed);
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
      sentenceSource: typeof card.sentenceSource === "string" ? card.sentenceSource.trim() : "",
      etymology: typeof card.etymology === "string"
        ? card.etymology.trim()
        : typeof card.charactersMeaning === "string" ? card.charactersMeaning.trim() : "",
      etymologySource: typeof card.etymologySource === "string" ? card.etymologySource.trim() : "",
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
      next.mastery = previous.mastery;
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
  merged.studyAllDecks = local.studyAllDecks;
  merged.sessionSize = local.sessionSize;
  merged.sessionMode = local.sessionMode;
  merged.studyMode = local.studyMode;
  merged.autoPlayPronunciation = local.autoPlayPronunciation;
  merged.theme = local.theme;
  return normalizeStore(merged);
}
