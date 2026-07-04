// Recommendation engine. Philosophy: curiosity over consumption.
// Tracks entity-level affinity (not just category), and deliberately injects
// "bridge" cards so a user interested in Romans eventually meets Galatians,
// Isaiah, the Prophets — not an endless loop of more Romans.

import { CONTENT, neighbors, bridgeFrom, entitiesOf } from "../data/graph.js";
import { state } from "./state.js";

const DECAY = 0.985;          // applied periodically so old signals fade
const REPEAT_WINDOW = 25;     // never show the same id twice within this many cards
const COLD_START_COUNT = 15;  // first N cards ignore affinity, force diversity
const BRIDGE_RATIO = 0.25;    // ~1 in 4 cards is a deliberate "bridge" to a new topic

function getAffinity() { return state.get("affinity", {}); }
function setAffinity(a) { state.set("affinity", a); }

function bump(map, id, amount) {
  map[id] = (map[id] || 0) + amount;
}

const WEIGHTS = { like: 3, save: 5, reveal: 1.5, view: 0.02, fastSkip: -1 };

/** Record a user signal (like/save/reveal/view/fastSkip) against a content item's entities. */
export function recordSignal(contentId, type, amount = 1) {
  const affinity = getAffinity();
  const weight = (WEIGHTS[type] ?? 0) * amount;
  if (weight === 0) return;
  for (const entity of entitiesOf(contentId)) bump(affinity, entity.id, weight);
  bump(affinity, "content:" + contentId, weight); // also track the specific item, for anti-repeat scoring
  setAffinity(affinity);
}

/** Slowly fade old signals so the feed doesn't ossify around one early interest. */
export function decayAffinity() {
  const affinity = getAffinity();
  for (const k in affinity) affinity[k] *= DECAY;
  setAffinity(affinity);
}

function topEntities(n = 3) {
  const affinity = getAffinity();
  return Object.entries(affinity)
    .filter(([k]) => !k.startsWith("content:"))
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k]) => k);
}

function scoreContent(item, affinity) {
  let score = 1; // base weight so everything has a chance
  for (const e of (item.links || [])) score += Math.max(0, affinity[e] || 0);
  return score;
}

function weightedSample(pool, n, affinity) {
  const picked = [];
  const candidates = pool.slice();
  for (let i = 0; i < n && candidates.length; i++) {
    const weights = candidates.map(c => scoreContent(c, affinity));
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    let idx = 0;
    for (; idx < weights.length; idx++) { r -= weights[idx]; if (r <= 0) break; }
    picked.push(candidates.splice(Math.min(idx, candidates.length - 1), 1)[0]);
  }
  return picked;
}

let recentIds = [];
function notRecentlyShown(item) { return !recentIds.includes(item.id); }
function markShown(ids) {
  recentIds = [...recentIds, ...ids].slice(-REPEAT_WINDOW);
}

let cardsServed = state.get("cardsServed", 0);

/**
 * Returns the next batch of content items, filtered by an optional category,
 * with cold-start diversity, affinity-weighted sampling, and bridge injection.
 */
export function nextBatch(n, { category = "all", pool: explicitPool } = {}) {
  const fullPool = explicitPool || CONTENT;
  const pool = (category === "all" ? fullPool : fullPool.filter(c => c.c === category)).filter(notRecentlyShown);
  if (!pool.length) return [];

  if (cardsServed < COLD_START_COUNT) {
    // round-robin across categories for breadth before the model has data
    const byCategory = {};
    pool.forEach(c => (byCategory[c.c] = byCategory[c.c] || []).push(c));
    const cats = Object.keys(byCategory);
    const batch = [];
    let i = 0;
    while (batch.length < n && batch.length < pool.length) {
      const cat = cats[i % cats.length];
      const arr = byCategory[cat];
      if (arr && arr.length) batch.push(arr.shift());
      i++;
      if (i > pool.length * 2) break;
    }
    cardsServed += batch.length;
    state.set("cardsServed", cardsServed);
    markShown(batch.map(b => b.id));
    return batch;
  }

  const affinity = getAffinity();
  const bridgeSlots = Math.round(n * BRIDGE_RATIO);
  const sampleSlots = n - bridgeSlots;

  const sampled = weightedSample(pool, sampleSlots, affinity);
  const shownIds = new Set(recentIds.concat(sampled.map(s => s.id)));

  const bridges = [];
  const tops = topEntities(3);
  for (const entityId of tops) {
    if (bridges.length >= bridgeSlots) break;
    const bridge = bridgeFrom(entityId, shownIds);
    if (bridge) { bridges.push(bridge); shownIds.add(bridge.id); }
  }
  // pad with extra weighted samples if not enough bridges were found
  while (bridges.length < bridgeSlots) {
    const extra = weightedSample(pool.filter(c => !shownIds.has(c.id)), 1, affinity)[0];
    if (!extra) break;
    bridges.push(extra);
    shownIds.add(extra.id);
  }

  const batch = [...sampled, ...bridges].filter(Boolean);
  cardsServed += batch.length;
  state.set("cardsServed", cardsServed);
  markShown(batch.map(b => b.id));
  decayAffinity();
  return shuffleInPlace(batch);
}

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Human-readable reason a card was likely surfaced — transparency over manipulation. */
export function whyRecommended(contentId) {
  const item = CONTENT.find(c => c.id === contentId);
  if (!item) return null;
  const affinity = getAffinity();
  const tops = topEntities(3);
  const matched = (item.links || []).find(l => tops.includes(l));
  if (!matched) return null;
  const ents = entitiesOf(contentId);
  const label = ents.find(e => e.id === matched)?.label;
  return label ? `More like this because you've been exploring ${label}` : null;
}
