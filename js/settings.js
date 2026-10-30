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

