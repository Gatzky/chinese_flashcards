function confirmImport() {
  if (!pendingImport?.cards.length) return;
  applyImport(pendingImport.cards, pendingImport.skipped, pendingImport.fileName);
  pendingImport = null;
  importDialog.close();
}

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

authModeButtons.forEach((button) => {
  button.addEventListener("click", () => updateAccountMode(button.dataset.authMode));
});

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
accountForm.addEventListener("submit", submitAccountForm);
passwordResetBtn.addEventListener("click", resetAccountPassword);
profilePasswordResetBtn.addEventListener("click", resetAccountPassword);
signOutBtn.addEventListener("click", signOutAccount);
wordForm.addEventListener("submit", addWord);
showWordFormBtn.addEventListener("click", showAddWordForm);
wordCancelBtn.addEventListener("click", resetWordForm);
wordDialog.addEventListener("close", resetWordForm);
renameDeckActionBtn.addEventListener("click", openRenameDeckDialog);
deleteDeckActionBtn.addEventListener("click", () => {
  deckOptionsDialog.close();
  deleteActiveDeck();
});
showWordsActionBtn.addEventListener("click", showWordsDialog);
closeDeckOptionsBtn.addEventListener("click", () => deckOptionsDialog.close());
closeWordsDialogBtn.addEventListener("click", () => wordsDialog.close());
renameDeckDialog.addEventListener("close", () => {
  renameDeckName.value = activeDeck().name;
});
closeRenameDialogBtn.addEventListener("click", () => renameDeckDialog.close());
cancelRenameBtn.addEventListener("click", () => renameDeckDialog.close());
renameDeckForm.addEventListener("submit", renameActiveDeck);
importAddBtn.addEventListener("click", chooseImport);
selectImportFileBtn.addEventListener("click", () => importFile.click());
importFile.addEventListener("change", analyzeImportFile);
confirmImportBtn.addEventListener("click", confirmImport);
cancelImportBtn.addEventListener("click", () => importDialog.close());
closeImportBtn.addEventListener("click", () => importDialog.close());
importDestination.addEventListener("change", updateImportFields);
exportDeckBtn.addEventListener("click", exportActiveDeck);
openFeedbackBtn.addEventListener("click", () => feedbackDialog.showModal());
feedbackForm.addEventListener("submit", sendFeedback);
closeFeedbackBtn.addEventListener("click", () => feedbackDialog.close());
cancelFeedbackBtn.addEventListener("click", () => feedbackDialog.close());
feedbackDialog.addEventListener("close", () => feedbackForm.reset());

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
updateImportFields();
updateAccountMode("signin");
updateAccountView(null);
studyModeSelect.value = store.studyMode;
autoplaySelect.value = store.autoPlayPronunciation ? "on" : "off";
startActiveDeck();
void initializeFirebase();
