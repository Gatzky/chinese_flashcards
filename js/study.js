function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickSessionCards(cards, size) {
  const masteryGroups = new Map();
  cards.forEach((card) => {
    const mastery = card.mastery ?? (card.attempts ? (card.misses ? 1 : 3) : 0);
    if (!masteryGroups.has(mastery)) masteryGroups.set(mastery, []);
    masteryGroups.get(mastery).push(card);
  });

  const ordered = [...masteryGroups.keys()]
    .sort((a, b) => a - b)
    .flatMap((mastery) => {
      const missGroups = new Map();
      masteryGroups.get(mastery).forEach((card) => {
        if (!missGroups.has(card.misses)) missGroups.set(card.misses, []);
        missGroups.get(card.misses).push(card);
      });
      return [...missGroups.keys()]
        .sort((a, b) => b - a)
        .flatMap((misses) => shuffle(missGroups.get(misses)));
    })
    .map(cloneStudyCard);

  if (!size || size >= ordered.length) return ordered;
  return ordered.slice(0, size);
}

function renderSessionSizeControls() {
  sessionSizeInput.value = store.sessionSize === 0 ? "" : String(store.sessionSize);
  sessionSizeControl.hidden = store.sessionMode !== "count";
  sessionModeButtons.forEach((button) => {
    const option = button.dataset.sessionModeOption;
    const isPressed = option === "unseen"
      ? ["unseen", "unseen-and-needs-practice"].includes(store.sessionMode)
      : option === "needs-practice"
        ? ["needs-practice", "unseen-and-needs-practice"].includes(store.sessionMode)
        : option === store.sessionMode;
    button.setAttribute("aria-pressed", String(isPressed));
  });
}

function renderStats() {
  const cards = studyDeckCards();
  statsPerfectEl.textContent = String(cards.filter((card) => card.mastery === 4).length);
  statsKnownEl.textContent = String(cards.filter((card) => card.mastery === 3).length);
  statsUnseenEl.textContent = String(cards.filter((card) => card.mastery === 0).length);
  statsUnsureEl.textContent = String(cards.filter((card) => card.mastery === 2).length);
  statsNoIdeaEl.textContent = String(cards.filter((card) => card.mastery === 1).length);
}

function currentCard() {
  return deck[index];
}

function renderCardTooltip(tooltip, content, source) {
  tooltip.replaceChildren();
  if (content) {
    const text = document.createElement("div");
    text.className = "card-tooltip-content";
    text.textContent = content;
    tooltip.appendChild(text);
  }
  if (!source) return;

  const disclosure = document.createElement("details");
  disclosure.className = "card-tooltip-source";
  const summary = document.createElement("summary");
  summary.textContent = "Source";
  disclosure.appendChild(summary);

  const match = source.match(/^(https?:\/\/\S+?)(?:\s+\((.*)\))?$/);
  if (match) {
    const link = document.createElement("a");
    link.href = match[1];
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = match[2] || "Open source";
    disclosure.appendChild(link);
  } else {
    const citation = document.createElement("span");
    citation.textContent = source;
    disclosure.appendChild(citation);
  }
  tooltip.appendChild(disclosure);
}

function updateCardTools(card) {
  speakBtn.disabled = !card || !("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window);
  sentenceBtn.disabled = !card?.sentence;
  etymologyBtn.disabled = !card?.etymology;
  renderCardTooltip(sentenceTooltipEl, card?.sentence, card?.sentenceSource);
  renderCardTooltip(etymologyTooltipEl, card?.etymology, card?.etymologySource);
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
  deckTitle.textContent = store.studyAllDecks
    ? store.selectedDeckIds.map((id) => deckById(id).name).join(", ")
    : activeDeck().name;
  cardEl.classList.add("is-changing");
  void cardEl.offsetWidth;
  cardEl.classList.remove("is-flipped");
  phase = 0;
  previousBtn.disabled = index === 0 || !deck.length;
  previousDetailsBtn.disabled = previousBtn.disabled;
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
    previousBtn.disabled = true;
    previousDetailsBtn.disabled = true;
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
  if (store.autoPlayPronunciation) speakCard(currentCard().hanzi);
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

function recordRating(card, didKnow) {
  const sourceDeckIds = card.sourceDeckIds || [activeDeck().id];
  const sourceCards = [];
  const sourceSnapshots = [];
  const studyCardSnapshot = {
    masteryScore: card.masteryScore,
    misses: card.misses,
    attempts: card.attempts,
    mastery: card.mastery,
  };
  sourceDeckIds.forEach((deckId) => {
    const sourceDeck = store.decks.find((deckItem) => deckItem.id === deckId);
    sourceDeck?.cards.filter((item) => item.hanzi === card.hanzi).forEach((stored) => {
      sourceSnapshots.push({
        deckId,
        values: {
          masteryScore: stored.masteryScore,
          misses: stored.misses,
          attempts: stored.attempts,
          mastery: stored.mastery,
        },
      });
      stored.masteryScore = nextMastery(stored.masteryScore, didKnow);
      stored.misses = didKnow
        ? Math.max(0, (stored.misses || 0) - 1)
        : Math.min(4, (stored.misses || 0) + 1);
      stored.attempts = (stored.attempts || 0) + 1;
      stored.mastery = masteryForScore(stored.masteryScore, stored.attempts);
      sourceCards.push(stored);
    });
  });
  card.masteryScore = sourceCards.length
    ? Math.min(...sourceCards.map((sourceCard) => sourceCard.masteryScore))
    : nextMastery(card.masteryScore, didKnow);
  card.misses = didKnow
    ? Math.max(0, (card.misses || 0) - 1)
    : Math.min(4, (card.misses || 0) + 1);
  card.attempts = (card.attempts || 0) + 1;
  card.mastery = masteryForScore(card.masteryScore, card.attempts);
  saveStore();
  renderStats();
  return { sourceSnapshots, studyCardSnapshot };
}

function updateSessionAnswerCounts() {
  knownAnswers = answerHistory.filter((item) => item.isKnown).length;
  unknownAnswers = answerHistory.filter((item) => !item.isKnown).length;
  const missedHanzi = new Set(answerHistory.filter((item) => !item.isKnown).map((item) => item.hanzi));
  unknown = deck.filter((card) => missedHanzi.has(card.hanzi)).map(cloneStudyCard);
}

function nextMastery(mastery, didKnow) {
  return Math.max(-4, Math.min(4, mastery + (didKnow ? 1 : -1)));
}

function answer(isKnown) {
  if ((phase !== 1 && phase !== 2) || !deck.length) return;

  const card = currentCard();
  const rating = recordRating(card, isKnown);
  answerHistory.push({ hanzi: card.hanzi, isKnown, ...rating });
  updateSessionAnswerCounts();

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
  scoreEl.textContent = `Cards known: ${knownAnswers} of ${knownAnswers + unknownAnswers}.`;
  summaryPreviousBtn.disabled = index === 0;
  retryUnknownBtn.disabled = unknown.length === 0;
}

function startSession(cards) {
  deck = shuffle(cards).map(cloneStudyCard);
  index = 0;
  phase = 0;
  answerHistory = [];
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
  renderSessionSizeControls();
  applyStudyMode();
  applyAutoPlaySetting();
  applyTheme();
  const cards = studyDeckCards();
  const includeUnseen = ["unseen", "unseen-and-needs-practice"].includes(store.sessionMode);
  const includeNeedsPractice = ["needs-practice", "unseen-and-needs-practice"].includes(store.sessionMode);
  const eligibleCards = includeUnseen || includeNeedsPractice
    ? cards.filter((card) => (
      (includeUnseen && card.mastery === 0)
      || (includeNeedsPractice && (card.mastery === 1 || card.mastery === 2))
    ))
    : cards;
  const sessionSize = store.sessionMode === "count" ? store.sessionSize : 0;
  startSession(pickSessionCards(eligibleCards, sessionSize));
}

function goToPreviousCard() {
  const fromSummary = !summaryEl.hidden;
  if (index === 0) return;

  const previousIndex = index - 1;
  const previousCard = deck[previousIndex];
  const current = fromSummary ? null : currentCard();
  if (current && phase !== 0 && current.hanzi !== previousCard.hanzi) {
    undoCardRatings(current);
  }
  undoCardRatings(previousCard);

  updateSessionAnswerCounts();
  saveStore();
  index = previousIndex;
  if (fromSummary) {
    appEl.classList.remove("hidden");
    summaryEl.classList.add("hidden");
    summaryEl.hidden = true;
  }
  renderCard();
}

function undoCardRatings(card) {
  for (let i = answerHistory.length - 1; i >= 0; i -= 1) {
    const rating = answerHistory[i];
    if (rating.hanzi !== card.hanzi) continue;
    rating.sourceSnapshots.forEach((snapshot) => {
      const sourceDeck = store.decks.find((deckItem) => deckItem.id === snapshot.deckId);
      const stored = sourceDeck?.cards.find((item) => item.hanzi === rating.hanzi);
      if (stored) Object.assign(stored, snapshot.values);
    });
    Object.assign(card, rating.studyCardSnapshot);
    answerHistory.splice(i, 1);
  }
}
