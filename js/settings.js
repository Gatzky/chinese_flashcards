sessionSizeSelect.addEventListener("change", () => {
  store.sessionSize = Number(sessionSizeSelect.value);
  saveStore();
  startActiveDeck();
});

studyModeSelect.addEventListener("change", () => {
  store.studyMode = studyModeSelect.value === "two" ? "two" : "three";
  saveStore();
  startActiveDeck();
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

function applyAutoPlaySetting() {
  autoplayButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String((button.dataset.autoplayOption === "on") === store.autoPlayPronunciation));
  });
}
