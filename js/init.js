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
document.querySelectorAll("[data-deck-move]").forEach((button) => {
  button.addEventListener("click", () => {
    const direction = button.dataset.deckMove;
    moveDeck(direction === "top" || direction === "bottom" ? direction : Number(direction));
  });
});
showWordsActionBtn.addEventListener("click", showWordsDialog);
closeDeckOptionsBtn.addEventListener("click", () => deckOptionsDialog.close());
closeWordsDialogBtn.addEventListener("click", () => wordsDialog.close());
renameDeckDialog.addEventListener("close", () => {
  renameDeckName.value = deckById(optionsDeckId).name;
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
feedbackDialog.addEventListener("close", () => {
  feedbackForm.reset();
  feedbackStatusEl.textContent = "";
});
openFeedbackInboxBtn.addEventListener("click", () => {
  feedbackInboxDialog.showModal();
  void loadFeedbackInbox();
});
closeFeedbackInboxBtn.addEventListener("click", () => feedbackInboxDialog.close());
appVersionBtn.addEventListener("click", () => changelogDialog.showModal());
closeChangelogBtn.addEventListener("click", () => changelogDialog.close());

window.CHANGELOG.forEach((release) => {
  const section = document.createElement("section");
  section.className = "changelog-release";
  const heading = document.createElement("h3");
  heading.textContent = release.version;
  const changes = document.createElement("ul");
  release.changes.forEach((change) => {
    const item = document.createElement("li");
    item.textContent = change;
    changes.appendChild(item);
  });
  section.append(heading, changes);
  changelogListEl.appendChild(section);
});

cardEl.addEventListener("click", flipCard);
speakBtn.addEventListener("click", () => speakCard(currentCard().hanzi));
sentenceBtn.addEventListener("click", () => toggleCardTooltip(sentenceBtn));
etymologyBtn.addEventListener("click", () => toggleCardTooltip(etymologyBtn));
knownBtn.addEventListener("click", () => answer(true));
unknownBtn.addEventListener("click", () => answer(false));
nextBtn.addEventListener("click", advanceCard);
previousBtn.addEventListener("click", goToPreviousCard);
previousDetailsBtn.addEventListener("click", goToPreviousCard);
summaryPreviousBtn.addEventListener("click", goToPreviousCard);
restartBtn.addEventListener("click", startActiveDeck);
retryUnknownBtn.addEventListener("click", () => {
  if (unknown.length) startSession(unknown);
});

renderSessionSizeControls();
updateImportFields();
updateAccountMode("signin");
updateAccountView(null);
applyStudyMode();
applyTheme();
applyAutoPlaySetting();
startActiveDeck();
void initializeFirebase();
