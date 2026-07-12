// "My facts" — user-authored cards pinned to the top of the For You feed.
// Stored locally (no account needed) via the same state gateway as everything
// else. Shaped exactly like a CONTENT item so cardHTML can render them as-is.

import { state } from "./state.js";
import { CATS } from "../data/graph.js";

const KEY = "userFacts";

/** Categories a user can post under — CATS keys, minus catechism (which needs
 *  a separate Q&A "answer" field that a free-form fact doesn't have). */
export const FACT_CATEGORIES = Object.keys(CATS).filter(k => k !== "catechism"); // verse, history, theology, funfact

export function getUserFacts() {
  const list = state.get(KEY, []);
  return Array.isArray(list) ? list : [];
}

/** Create + persist a fact. Returns the new fact, or null if text is empty. */
export function addUserFact({ text, ref, category }) {
  const clean = (text || "").trim();
  if (!clean) return null;
  const c = FACT_CATEGORIES.includes(category) ? category : "funfact";
  const fact = {
    id: "user." + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    c,
    text: clean,
    ref: (ref || "").trim() || "Your note",
    links: [],
    _user: true,
    createdAt: Date.now(),
  };
  state.update(KEY, [], list => [fact, ...(Array.isArray(list) ? list : [])]);
  return fact;
}

export function deleteUserFact(id) {
  state.update(KEY, [], list => (Array.isArray(list) ? list : []).filter(f => f.id !== id));
}
