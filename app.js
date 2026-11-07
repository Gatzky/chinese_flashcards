const views = [
  ["manage-deck-view", "views/manage-deck.html"],
  ["study-view", "views/study.html"],
  ["settings-view", "views/settings.html"],
  ["account-view", "views/account.html"],
  ["dialog-view", "views/dialogs.html"],
];

function assetUrl(path) {
  const url = new URL(path, import.meta.url);
  const version = new URL(import.meta.url).searchParams.get("v");
  if (version) url.searchParams.set("v", version);
  return url;
}

async function loadView([containerId, path]) {
  const response = await fetch(assetUrl(path), { cache: "no-cache" });
  if (!response.ok) throw new Error(`Could not load ${path} (${response.status}).`);
  document.getElementById(containerId).innerHTML = await response.text();
}

async function loadHskDeck(path, expectedId, expectedName) {
  const response = await fetch(assetUrl(path), { cache: "no-cache" });
  if (!response.ok) throw new Error(`Could not load ${path} (${response.status}).`);
  const deck = await response.json();
  if (!deck ||
    deck.id !== expectedId ||
    deck.name !== expectedName ||
    !Array.isArray(deck.cards) ||
    deck.cards.some((card) =>
      !card ||
      typeof card.hanzi !== "string" ||
      typeof card.pinyin !== "string" ||
      typeof card.meaning !== "string")) {
    throw new Error(`The HSK vocabulary data in ${path} is invalid.`);
  }
  return deck;
}

async function loadHskDecks() {
  window.HSK_DECKS = await Promise.all([
    loadHskDeck("data/hsk1.json", "starter", "HSK 1"),
    loadHskDeck("data/hsk2.json", "hsk2", "HSK 2"),
    loadHskDeck("data/hsk3.json", "hsk3", "HSK 3"),
  ]);
}

function loadScript(path) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = assetUrl(path);
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Could not load ${path}.`));
    document.body.appendChild(script);
  });
}

try {
  await loadHskDecks();
  await Promise.all(views.map(loadView));
  for (const script of [
    "js/core.js",
    "js/study.js",
    "js/manage-deck.js",
    "js/settings.js",
    "js/account.js",
    "js/init.js",
  ]) {
    await loadScript(script);
  }
} catch (error) {
  const alert = document.createElement("p");
  alert.setAttribute("role", "alert");
  alert.textContent = `The app could not start: ${error.message}`;
  document.body.prepend(alert);
}