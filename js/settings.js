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
  store.sessionMode = "count";
  renderSessionSizeControls();
  saveStore();
  startActiveDeck();
});

sessionSizeInput.addEventListener("input", () => {
  sessionSizeInput.setCustomValidity("");
});

sessionModeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    store.sessionMode = button.dataset.sessionModeOption;
    sessionSizeInput.setCustomValidity("");
    renderSessionSizeControls();
    saveStore();
    startActiveDeck();
  });
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
