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

function renderStats() {
  const cards = activeDeck().cards;
  const knownCount = cards.filter((card) => card.attempts > 0 && !card.misses).length;
  const unseenCount = cards.filter((card) => !card.attempts && !card.misses).length;
  const unknownCount = cards.filter((card) => card.misses > 0).length;
  statsKnownEl.textContent = String(knownCount);
  statsUnseenEl.textContent = String(unseenCount);
  statsUnknownEl.textContent = String(unknownCount);
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

