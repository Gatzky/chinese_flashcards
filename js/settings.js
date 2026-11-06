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

autoplaySelect.addEventListener("change", () => {
  store.autoPlayPronunciation = autoplaySelect.value === "on";
  saveStore();
});

themeSelect.addEventListener("change", () => {
  store.theme = themeSelect.value === "light" ? "light" : "black";
  applyTheme();
  saveStore();
});

function applyTheme() {
  document.documentElement.dataset.theme = store.theme;
}
