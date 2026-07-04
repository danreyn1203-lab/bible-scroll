// Growth-framed retention: streaks, a daily anchor card, and literacy coverage —
// deliberately not screen-time metrics. Engagement (like/save/reveal) is what
// advances a streak; merely opening the app does not.

import { state } from "./state.js";
import { CONTENT } from "../data/graph.js";

function todayKey() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD, local calendar day
}

export function recordEngagement() {
  const today = todayKey();
  const streak = state.get("streak", { lastDay: null, count: 0, longest: 0 });
  if (streak.lastDay === today) return streak; // already counted today

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const next = {
    lastDay: today,
    count: streak.lastDay === yesterday ? streak.count + 1 : 1,
    longest: 0,
  };
  next.longest = Math.max(streak.longest || 0, next.count);
  state.set("streak", next);
  return next;
}

export function getStreak() {
  return state.get("streak", { lastDay: null, count: 0, longest: 0 });
}

/** Deterministic "Today's Bread" card, same for everyone on a given calendar day. */
export function todaysCard() {
  const today = todayKey();
  let hash = 0;
  for (let i = 0; i < today.length; i++) hash = (hash * 31 + today.charCodeAt(i)) >>> 0;
  return CONTENT[hash % CONTENT.length];
}

export function totalReflections() {
  const liked = state.get("liked", {});
  const saved = state.get("saved", {});
  return new Set([...Object.keys(liked), ...Object.keys(saved)]).size;
}

/** Literacy/coverage framing instead of vanity screen-time stats. */
export function graphCoverage() {
  const liked = state.get("liked", {});
  const saved = state.get("saved", {});
  const touchedIds = new Set([...Object.keys(liked), ...Object.keys(saved)]);
  const touchedBooks = new Set();
  CONTENT.forEach(c => {
    if (!touchedIds.has(c.id)) return;
    (c.links || []).filter(l => l.startsWith("book.")).forEach(b => touchedBooks.add(b));
  });
  return { booksTouched: touchedBooks.size, itemsTouched: touchedIds.size };
}

export function checkMilestone(streak) {
  const milestones = [3, 7, 14, 30, 100];
  if (milestones.includes(streak.count)) return `${streak.count}-day streak ✦`;
  return null;
}
