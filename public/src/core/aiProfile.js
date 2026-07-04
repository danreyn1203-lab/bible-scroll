// Adaptive AI profile — entirely derived from anonymous in-app behavior
// already collected by engine.js (affinity) and telemetry.js (dwell timing),
// plus one explicit user setting (preferred translation). No names, emails,
// device identifiers, or location are ever read or stored — every field
// below is a content-engagement signal, kept locally in this browser only.

import { state } from "./state.js";
import { entityIndex } from "../data/graph.js";
import { contentIndex } from "../data/graph.js";

const TRANSLATIONS = ["ESV", "NIV", "KJV", "NASB", "NLT"];

function topByPrefix(affinity, prefix, n) {
  return Object.entries(affinity)
    .filter(([k, v]) => k.startsWith(prefix) && v > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k]) => entityIndex.get(k))
    .filter(Boolean);
}

export function favoriteBooks(n = 4) {
  return topByPrefix(state.get("affinity", {}), "book.", n);
}
export function favoriteThemes(n = 4) {
  return topByPrefix(state.get("affinity", {}), "theme.", n);
}
export function favoritePeriods(n = 3) {
  return topByPrefix(state.get("affinity", {}), "period.", n);
}
export function favoriteTheologians(n = 3) {
  return topByPrefix(state.get("affinity", {}), "theologian.", n);
}
export function favoriteHistoricalTopics(n = 4) {
  const affinity = state.get("affinity", {});
  const events = topByPrefix(affinity, "event.", n);
  const places = topByPrefix(affinity, "place.", n);
  return [...events, ...places]
    .sort((a, b) => (affinity[b.id] || 0) - (affinity[a.id] || 0))
    .slice(0, n);
}

function median(nums) {
  if (!nums.length) return null;
  const sorted = nums.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** Reading speed, estimated from words-per-card / dwell-time on short-form content. */
export function readingSpeed() {
  const log = state.get("timing", []);
  const samples = log.filter(e => (e.cat === "verse" || e.cat === "funfact") && e.dwellMs > 0);
  if (samples.length < 4) return { label: "Still learning your pace", wpm: null };
  const wpm = median(samples.map(e => (e.words / (e.dwellMs / 60000))));
  const label = wpm > 220 ? "Brisk" : wpm > 120 ? "Steady" : "Slow & attentive";
  return { label, wpm: Math.round(wpm) };
}

/** Reflection time, estimated from dwell on theology/catechism or any card where an answer was revealed. */
export function reflectionTime() {
  const log = state.get("timing", []);
  const samples = log.filter(e => e.reflected || e.cat === "theology" || e.cat === "catechism");
  if (samples.length < 3) return { label: "Still learning your rhythm", seconds: null };
  const ms = median(samples.map(e => e.dwellMs));
  const label = ms < 8000 ? "Quick" : ms < 20000 ? "Thoughtful" : "Deep";
  return { label, seconds: Math.round(ms / 1000) };
}

function categoryDistribution() {
  const liked = state.get("liked", {});
  const saved = state.get("saved", {});
  const counts = { verse: 0, history: 0, theology: 0, catechism: 0, funfact: 0 };
  new Set([...Object.keys(liked), ...Object.keys(saved)]).forEach(id => {
    const item = contentIndex.get(id);
    if (item) counts[item.c] = (counts[item.c] || 0) + 1;
  });
  return counts;
}

export function learningStyle() {
  const counts = categoryDistribution();
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (total < 3) return "Still finding your rhythm";
  const [dominant] = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const labels = {
    theology: "Analytical — drawn to doctrine and definitions",
    catechism: "Analytical — drawn to doctrine and definitions",
    history: "Curious Explorer — drawn to historical context",
    verse: "Devotional — anchored in Scripture itself",
    funfact: "Curious Browser — drawn to discovery",
  };
  return labels[dominant[0]] || "Balanced";
}

export function difficultyPreference() {
  const counts = categoryDistribution();
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (total < 3) return "Still calibrating";
  const deep = (counts.theology + counts.catechism) / total;
  const light = (counts.verse + counts.funfact) / total;
  if (deep > 0.55) return "Deep — comfortable with doctrine and definitions";
  if (light > 0.55) return "Foundational — verses and stories first";
  return "Intermediate — a healthy mix";
}

export function getPreferredTranslation() {
  return state.get("translation", "ESV");
}
export function cyclePreferredTranslation() {
  const current = getPreferredTranslation();
  const next = TRANSLATIONS[(TRANSLATIONS.indexOf(current) + 1) % TRANSLATIONS.length];
  state.set("translation", next);
  return next;
}

export function buildAIProfile() {
  return {
    favoriteBooks: favoriteBooks(),
    favoriteThemes: favoriteThemes(),
    favoritePeriods: favoritePeriods(),
    favoriteTheologians: favoriteTheologians(),
    favoriteHistoricalTopics: favoriteHistoricalTopics(),
    readingSpeed: readingSpeed(),
    reflectionTime: reflectionTime(),
    learningStyle: learningStyle(),
    difficultyPreference: difficultyPreference(),
    preferredTranslation: getPreferredTranslation(),
    privacyNote: "Derived only from in-app reading behavior, stored on this device. No name, email, or location is ever collected.",
  };
}
