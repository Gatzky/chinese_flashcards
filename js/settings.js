sessionSizeInput.addEventListener("change", () => {
  sessionSizeInput.setCustomValidity("");
  if (!sessionSizeInput.value) {
    sessionSizeInput.setCustomValidity("Enter a card count or choose All.");
    sessionSizeInput.reportValidity();
    return;
  }
  if (!sessionSizeInput.reportValidity()) return;
  const size = Number(sessionSizeInput.value);
  if (!Number.isSafeInteger(size) || size < 1) {
    sessionSizeInput.setCustomValidity("Enter a positive whole number of cards.");
    sessionSizeInput.reportValidity();
    return;
  }
  sessionSizeInput.setCustomValidity("");
  store.sessionSize = size;
  sessionSizeAllButton.setAttribute("aria-pressed", "false");
  saveStore();
  startActiveDeck();
});

sessionSizeInput.addEventListener("input", () => {
  sessionSizeInput.setCustomValidity("");
  sessionSizeAllButton.setAttribute("aria-pressed", "false");
});

sessionSizeAllButton.addEventListener("click", () => {
  sessionSizeInput.setCustomValidity("");
  store.sessionSize = 0;
  sessionSizeInput.value = "";
  sessionSizeAllButton.setAttribute("aria-pressed", "true");
  saveStore();
  startActiveDeck();
});

studyModeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    store.studyMode = button.dataset.studyModeOption === "two" ? "two" : "three";
    applyStudyMode();
    saveStore();
    startActiveDeck();
  });
});

autoplayButtons.forEach((button) => {
  button.addEventListener("click", () => {
    store.autoPlayPronunciation = button.dataset.autoplayOption === "on";
    applyAutoPlaySetting();
    saveStore();
  });
});

themeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    store.theme = button.dataset.themeOption === "light" ? "light" : "black";
    applyTheme();
    saveStore();
  });
});

function applyTheme() {
  document.documentElement.dataset.theme = store.theme;
  themeButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.themeOption === store.theme));
  });
}

function applyStudyMode() {
  studyModeButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.studyModeOption === store.studyMode));
  });
}

function applyAutoPlaySetting() {
  autoplayButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String((button.dataset.autoplayOption === "on") === store.autoPlayPronunciation));
  });
}
