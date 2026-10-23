const CARDS = [
  { hanzi: "你", pinyin: "nǐ", meaning: "ty" },
  { hanzi: "好", pinyin: "hǎo", meaning: "dobry" },
  { hanzi: "我", pinyin: "wǒ", meaning: "ja" },
  { hanzi: "是", pinyin: "shì", meaning: "być" },
  { hanzi: "中", pinyin: "zhōng", meaning: "środek / Chiny" },
  { hanzi: "国", pinyin: "guó", meaning: "kraj" },
  { hanzi: "人", pinyin: "rén", meaning: "człowiek" },
  { hanzi: "学", pinyin: "xué", meaning: "uczyć się" },
  { hanzi: "水", pinyin: "shuǐ", meaning: "woda" },
  { hanzi: "爱", pinyin: "ài", meaning: "miłość / kochać" },
];

const cardEl = document.getElementById("card");
const hanziEl = document.getElementById("hanzi");
const hanziBackEl = document.getElementById("hanzi-back");
const pinyinEl = document.getElementById("pinyin");
const meaningEl = document.getElementById("meaning");
const progressEl = document.getElementById("progress");
const knownBtn = document.getElementById("known-btn");
const unknownBtn = document.getElementById("unknown-btn");
const noteEl = document.getElementById("note");
const appEl = document.querySelector(".app");
const summaryEl = document.getElementById("summary");
const scoreEl = document.getElementById("score");
const retryUnknownBtn = document.getElementById("retry-unknown-btn");
const restartBtn = document.getElementById("restart-btn");

let deck = [...CARDS];
let index = 0;
let flipped = false;
let known = [];
let unknown = [];

function currentCard() {
  return deck[index];
}

function renderCard() {
  const card = currentCard();
  hanziEl.textContent = card.hanzi;
  hanziBackEl.textContent = card.hanzi;
  pinyinEl.textContent = card.pinyin;
  meaningEl.textContent = card.meaning;
  progressEl.textContent = `${index + 1} / ${deck.length}`;
  cardEl.classList.remove("is-flipped");
  flipped = false;
  knownBtn.disabled = true;
  unknownBtn.disabled = true;
  noteEl.textContent = "Najpierw odwróć kartę, potem oceń, czy znasz znak.";
}

function flipCard() {
  flipped = !flipped;
  cardEl.classList.toggle("is-flipped", flipped);
  knownBtn.disabled = !flipped;
  unknownBtn.disabled = !flipped;
  noteEl.textContent = flipped
    ? "Czy umiesz ten znak?"
    : "Najpierw odwróć kartę, potem oceń, czy znasz znak.";
}

function answer(isKnown) {
  if (!flipped) return;

  const card = currentCard();
  if (isKnown) {
    known.push(card);
  } else {
    unknown.push(card);
  }

  index += 1;
  if (index >= deck.length) {
    showSummary();
    return;
  }

  renderCard();
}

function showSummary() {
  appEl.classList.add("hidden");
  summaryEl.classList.remove("hidden");
  summaryEl.hidden = false;
  scoreEl.textContent = `Znasz ${known.length} z ${known.length + unknown.length} znaków.`;
  retryUnknownBtn.disabled = unknown.length === 0;
}

function startSession(cards) {
  deck = [...cards];
  index = 0;
  known = [];
  unknown = [];
  appEl.classList.remove("hidden");
  summaryEl.classList.add("hidden");
  summaryEl.hidden = true;
  renderCard();
}

cardEl.addEventListener("click", flipCard);
knownBtn.addEventListener("click", () => answer(true));
unknownBtn.addEventListener("click", () => answer(false));
restartBtn.addEventListener("click", () => startSession(CARDS));
retryUnknownBtn.addEventListener("click", () => {
  if (unknown.length) startSession(unknown);
});

startSession(CARDS);
