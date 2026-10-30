const views = [
  ["manage-deck-view", "views/manage-deck.html"],
  ["study-view", "views/study.html"],
  ["settings-view", "views/settings.html"],
  ["account-view", "views/account.html"],
  ["dialog-view", "views/dialogs.html"],
];

async function loadView([containerId, path]) {
  const response = await fetch(new URL(path, import.meta.url));
  if (!response.ok) throw new Error(`Could not load ${path} (${response.status}).`);
  document.getElementById(containerId).innerHTML = await response.text();
}

function loadScript(path) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = new URL(path, import.meta.url);
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Could not load ${path}.`));
    document.body.appendChild(script);
  });
}

try {
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