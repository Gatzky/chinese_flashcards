let optionsDeckId = "";
let wordListDeckId = "";
let selectingDecks = false;
let draftSelectedDeckIds = new Set();

function renderDeckList() {
  deckListEl.innerHTML = "";
  importTarget.innerHTML = "";
  const selectDecksButton = document.createElement("button");
  selectDecksButton.type = "button";
  selectDecksButton.className = "deck-option";
  selectDecksButton.classList.toggle("is-active", selectingDecks);
  selectDecksButton.setAttribute("aria-pressed", String(selectingDecks));
  const selectDecksName = document.createElement("span");
  selectDecksName.className = "deck-option-name";
  selectDecksName.textContent = "Select more decks";
  const selectedCount = document.createElement("span");
  selectedCount.className = "deck-option-count";
  selectedCount.textContent = selectingDecks
    ? `${draftSelectedDeckIds.size} selected`
    : "";
  selectDecksButton.append(selectDecksName, selectedCount);
  selectDecksButton.addEventListener("click", () => {
    if (selectingDecks) {
      selectingDecks = false;
    } else {
      selectingDecks = true;
      draftSelectedDeckIds = new Set(
        store.studyAllDecks ? store.selectedDeckIds : [store.activeId],
      );
    }
    renderDeckList();
  });
  deckListEl.appendChild(selectDecksButton);

  const selectionActions = document.createElement("div");
  selectionActions.className = "deck-selection-actions";
  const studySelectedButton = document.createElement("button");
  studySelectedButton.type = "button";
  studySelectedButton.className = "btn btn-ghost btn-small";
  studySelectedButton.textContent = `Study selected decks (${draftSelectedDeckIds.size})`;
  studySelectedButton.disabled = draftSelectedDeckIds.size < 2;
  studySelectedButton.addEventListener("click", () => {
    if (draftSelectedDeckIds.size < 2) return;
    resetWordForm();
    wordsDialog.close();
    deckOptionsDialog.close();
    store.selectedDeckIds = store.decks
      .filter((deckItem) => draftSelectedDeckIds.has(deckItem.id))
      .map((deckItem) => deckItem.id);
    store.studyAllDecks = true;
    selectingDecks = false;
    saveStore();
    setStatus("");
    startActiveDeck();
  });
  const cancelSelectionButton = document.createElement("button");
  cancelSelectionButton.type = "button";
  cancelSelectionButton.className = "btn btn-ghost btn-small";
  cancelSelectionButton.textContent = "Cancel";
  cancelSelectionButton.addEventListener("click", () => {
    selectingDecks = false;
    renderDeckList();
  });
  selectionActions.append(studySelectedButton, cancelSelectionButton);
  selectionActions.hidden = !selectingDecks;
  deckListEl.appendChild(selectionActions);
  deckListEl.classList.toggle("is-selecting-decks", selectingDecks);

  store.decks.forEach((deckItem) => {
    const row = document.createElement("div");
    row.className = "deck-option-row";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "deck-selection-checkbox";
    checkbox.checked = draftSelectedDeckIds.has(deckItem.id);
    checkbox.setAttribute("aria-label", `Select ${deckItem.name}`);
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) draftSelectedDeckIds.add(deckItem.id);
      else draftSelectedDeckIds.delete(deckItem.id);
      selectedCount.textContent = `${draftSelectedDeckIds.size} selected`;
      studySelectedButton.textContent = `Study selected decks (${draftSelectedDeckIds.size})`;
      studySelectedButton.disabled = draftSelectedDeckIds.size < 2;
    });

    const button = document.createElement("button");
    button.type = "button";
    button.className = "deck-option";
    const isActive = store.studyAllDecks
      ? store.selectedDeckIds.includes(deckItem.id)
      : deckItem.id === store.activeId;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));

    const name = document.createElement("span");
    name.className = "deck-option-name";
    name.textContent = deckItem.name;

    const count = document.createElement("span");
    count.className = "deck-option-count";
    count.textContent = String(deckItem.cards.length);

    button.append(name, count);
    button.addEventListener("click", () => {
      resetWordForm();
      wordsDialog.close();
      deckOptionsDialog.close();
      store.activeId = deckItem.id;
      store.studyAllDecks = false;
      store.selectedDeckIds = [];
      selectingDecks = false;
      saveStore();
      setStatus("");
      startActiveDeck();
    });
    row.append(checkbox, button);

    const optionsButton = document.createElement("button");
    optionsButton.type = "button";
    optionsButton.className = "icon-btn deck-option-gear";
    optionsButton.textContent = "⚙";
    optionsButton.title = "Deck options";
    optionsButton.setAttribute("aria-label", `Options for ${deckItem.name}`);
    optionsButton.addEventListener("click", () => openDeckOptions(deckItem.id));
    row.appendChild(optionsButton);

    deckListEl.appendChild(row);

    const option = document.createElement("option");
    option.value = deckItem.id;
    option.textContent = deckItem.name;
    importTarget.appendChild(option);
  });
  importTarget.value = store.activeId;
  renameDeckName.value = deckById(optionsDeckId).name;
  deleteDeckActionBtn.disabled = store.decks.length <= 1;
}

function openDeckOptions(deckId) {
  optionsDeckId = deckId;
  renameDeckName.value = deckById(optionsDeckId).name;
  deleteDeckActionBtn.disabled = store.decks.length <= 1;
  deckOptionsDialog.showModal();
}

function moveDeck(direction) {
  const fromIndex = store.decks.findIndex((deckItem) => deckItem.id === optionsDeckId);
  if (fromIndex < 0) return;
  const toIndex = direction === "top"
    ? 0
    : direction === "bottom"
      ? store.decks.length - 1
      : fromIndex + direction;
  if (toIndex < 0 || toIndex >= store.decks.length || toIndex === fromIndex) return;
  const [deckItem] = store.decks.splice(fromIndex, 1);
  store.decks.splice(toIndex, 0, deckItem);
  saveStore();
  renderDeckList();
}

function renderWordList(deckItem = activeDeck()) {
  wordListDeckId = deckItem.id;
  const cards = deckItem.cards;
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

    const actions = document.createElement("div");
    actions.className = "word-item-actions";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "btn btn-ghost btn-small edit-word-btn";
    editButton.textContent = "Edit";
    editButton.setAttribute("aria-label", `Edit ${card.hanzi}`);
    editButton.addEventListener("click", () => editWord(card));

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "icon-btn remove-word-btn";
    removeButton.title = "Delete word";
    removeButton.setAttribute("aria-label", `Delete ${card.hanzi} from this deck`);
    removeButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 7h16M10 11v6m4-6v6M5 7l1 14h12l1-14M9 7V4h6v3" /></svg>';
    removeButton.addEventListener("click", () => removeWord(card.hanzi));

    actions.append(editButton, removeButton);
    item.append(details, actions);
    wordListEl.appendChild(item);
  });
}

function setStatus(message) {
  importStatus.textContent = message;
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
  store.studyAllDecks = false;
  store.selectedDeckIds = [];
  newDeckName.value = "";
  resetWordForm();
  saveStore();
  setStatus(`Created deck "${name}".`);
  startActiveDeck();
}

function renameActiveDeck(event) {
  event.preventDefault();
  const name = renameDeckName.value.trim();
  if (!name) {
    setStatus("Enter a name for the deck.");
    return;
  }

  const current = deckById(optionsDeckId);
  const previousName = current.name;
  current.name = name;
  saveStore();
  renameDeckDialog.close();
  setStatus(`Renamed "${previousName}" to "${name}".`);
  startActiveDeck();
}

function openRenameDeckDialog() {
  deckOptionsDialog.close();
  renameDeckName.value = deckById(optionsDeckId).name;
  renameDeckDialog.showModal();
  renameDeckName.focus();
}

function showWordsDialog() {
  deckOptionsDialog.close();
  renderWordList(deckById(optionsDeckId));
  wordsDialog.showModal();
}

function resetWordForm() {
  editingHanzi = "";
  wordForm.reset();
  showWordFormBtn.hidden = false;
  wordFormTitle.textContent = "Add a word";
  wordSaveBtn.textContent = "Add word";
  wordCancelBtn.hidden = true;
  if (wordDialog.open) wordDialog.close();
}

function showAddWordForm() {
  resetWordForm();
  showWordFormBtn.hidden = true;
  wordCancelBtn.hidden = false;
  wordDialog.showModal();
  wordHanziInput.focus();
}

function editWord(card) {
  editingHanzi = card.hanzi;
  wordHanziInput.value = card.hanzi;
  wordPinyinInput.value = card.pinyin;
  wordMeaningInput.value = card.meaning;
  wordSentenceInput.value = card.sentence;
  wordEtymologyInput.value = card.etymology;
  wordFormTitle.textContent = `Edit ${card.hanzi}`;
  wordSaveBtn.textContent = "Save changes";
  showWordFormBtn.hidden = true;
  wordCancelBtn.hidden = false;
  wordDialog.showModal();
  wordHanziInput.focus();
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

  const current = deckById(wordListDeckId);
  let action = "Added";
  if (editingHanzi) {
    const originalIndex = current.cards.findIndex((item) => item.hanzi === editingHanzi);
    if (originalIndex < 0) {
      resetWordForm();
      return;
    }
    if (card.hanzi !== editingHanzi && current.cards.some((item) => item.hanzi === card.hanzi)) {
      setStatus(`A word with the hanzi "${card.hanzi}" already exists in this deck.`);
      return;
    }
    const original = current.cards[originalIndex];
    const updated = cloneCard(card);
    updated.misses = original.misses;
    updated.attempts = original.attempts;
    updated.mastery = original.mastery;
    current.cards.splice(originalIndex, 1, updated);
    action = "Updated";
  } else {
    const isUpdate = current.cards.some((item) => item.hanzi === card.hanzi);
    current.cards = mergeCards(current.cards, [card]);
    action = isUpdate ? "Updated" : "Added";
  }
  saveStore();
  setStatus(`${action} "${card.hanzi}" in "${current.name}".`);
  resetWordForm();
  startActiveDeck();
}

function removeWord(hanzi) {
  const current = deckById(wordListDeckId);
  if (!confirm(`Remove "${hanzi}" from "${current.name}"?`)) return;
  current.cards = current.cards.filter((card) => card.hanzi !== hanzi);
  if (editingHanzi === hanzi) resetWordForm();
  saveStore();
  setStatus(`Removed "${hanzi}" from "${current.name}".`);
  startActiveDeck();
}

function deleteActiveDeck() {
  if (store.decks.length <= 1) return;
  const current = deckById(optionsDeckId);
  const name = current.name;
  if (!confirm(`Delete deck "${name}"?`)) return;
  store.decks = store.decks.filter((deckItem) => deckItem.id !== current.id);
  if (store.activeId === current.id) store.activeId = store.decks[0].id;
  store.selectedDeckIds = store.selectedDeckIds.filter((id) => id !== current.id);
  if (store.selectedDeckIds.length < 2) {
    store.studyAllDecks = false;
    store.selectedDeckIds = [];
  }
  optionsDeckId = store.activeId;
  resetWordForm();
  saveStore();
  setStatus(`Deleted deck "${name}".`);
  startActiveDeck();
}

function applyImport(incoming, skipped, fileName) {
  let current;
  if (importDestination.value === "new") {
    const requestedName = importDeckName.value.trim();
    const fallbackName = fileName.replace(/\.json$/i, "").trim();
    current = {
      id: createId(),
      name: requestedName || fallbackName || "Imported deck",
      cards: [],
    };
    store.decks.push(current);
    store.activeId = current.id;
    store.studyAllDecks = false;
    store.selectedDeckIds = [];
    current.cards = mergeCards([], incoming);
  } else {
    current = store.decks.find((deckItem) => deckItem.id === importTarget.value);
    if (!current) {
      setStatus("Choose a deck to import into.");
      return;
    }
    current.cards = mergeCards(current.cards, incoming);
    store.activeId = current.id;
    store.studyAllDecks = false;
    store.selectedDeckIds = [];
  }
  saveStore();

  const skippedNote = skipped.length ? ` Skipped entries: ${skipped.join(", ")}.` : "";
  setStatus(`Imported ${incoming.length} cards into "${current.name}".${skippedNote}`);
  startActiveDeck();
}

function chooseImport() {
  pendingImport = null;
  importFile.value = "";
  importFileName.value = "No file selected";
  importAnalysis.textContent = "Choose a JSON file to analyze it.";
  importAnalysis.dataset.state = "";
  confirmImportBtn.disabled = true;
  importDestination.value = "new";
  importTarget.value = store.activeId;
  importDeckName.value = "";
  updateImportFields();
  importDialog.showModal();
}

function updateImportFields() {
  const createNew = importDestination.value === "new";
  importNameField.hidden = !createNew;
  importTargetField.hidden = createNew;
}

function exportActiveDeck() {
  const current = activeDeck();
  const data = {
    name: current.name,
    cards: current.cards.map(({ hanzi, pinyin, meaning, sentence, sentenceSource, etymology, etymologySource }) => ({
      hanzi,
      pinyin,
      meaning,
      sentence,
      sentenceSource,
      etymology,
      etymologySource,
    })),
  };
  const blob = new Blob([`${JSON.stringify(data, null, 2)}\n`], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${current.name.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_").trim() || "deck"}.json`;
  link.click();
  URL.revokeObjectURL(url);
  setStatus(`Exported "${current.name}" as JSON.`);
}

async function analyzeImportFile() {
  const file = importFile.files[0];
  pendingImport = null;
  confirmImportBtn.disabled = true;
  if (!file) {
    importFileName.value = "No file selected";
    importAnalysis.textContent = "Choose a JSON file to analyze it.";
    importAnalysis.dataset.state = "";
    return;
  }

  importFileName.value = file.name;
  importAnalysis.textContent = "Analyzing file...";
  importAnalysis.dataset.state = "";
  try {
    const result = parseJson(await file.text());
    pendingImport = { ...result, fileName: file.name };
    const skippedNote = result.skipped.length
      ? `Skipped entries: ${result.skipped.join(", ")}.`
      : "All entries are valid.";
    importAnalysis.textContent = `Analysis complete: ${result.total} entries, ${result.cards.length} valid, ${result.skipped.length} skipped. ${skippedNote}`;
    importAnalysis.dataset.state = result.skipped.length ? "partial" : "success";
    if (!result.cards.length) {
      importAnalysis.textContent += " No valid cards to import.";
      importAnalysis.dataset.state = "error";
      return;
    }
    confirmImportBtn.disabled = false;
  } catch (error) {
    importAnalysis.textContent = `Could not analyze JSON: ${error.message}`;
    importAnalysis.dataset.state = "error";
  }
}
