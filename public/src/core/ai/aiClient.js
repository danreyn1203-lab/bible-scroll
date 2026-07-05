// AI client — routes all calls to the real OpenAI-backed API endpoints.
// UI features call these functions; they never talk to the backend directly.

import { state } from "../state.js";

export class PremiumRequiredError extends Error {
  constructor() { super("premium_required"); this.name = "PremiumRequiredError"; }
}

export class AIComingSoonError extends Error {
  constructor() { super("ai_coming_soon"); this.name = "AIComingSoonError"; }
}

async function handleResponse(res) {
  if (res.status === 403) {
    const data = await res.json().catch(() => ({}));
    if (data.code === "premium_required") throw new PremiumRequiredError();
  }
  if (res.status === 503) {
    const data = await res.json().catch(() => ({}));
    if (data.code === "ai_coming_soon") throw new AIComingSoonError();
  }
  if (!res.ok) throw new Error(`AI request failed: ${res.status}`);
  return res.json();
}

async function apiFetch(path, params = {}) {
  const url = new URL(path, window.location.origin);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url, { credentials: "same-origin" });
  return handleResponse(res);
}

async function apiPost(path, body) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

/** Bible Q&A chat */
export async function chat(message) {
  return apiPost("/api/ai/chat", { message });
}

/** Semantic search over content + entities */
export async function semanticSearch(query) {
  return apiFetch("/api/ai/search", { q: query });
}

/** Day-by-day study plan for a topic entity */
export async function generateStudyPlan(goalEntityId, days = 5) {
  const data = await apiFetch("/api/ai/study-plan", { entityId: goalEntityId, days });
  return data.days ?? [];
}

/** Quiz questions for a topic entity */
export async function generateQuiz(topicEntityId) {
  const data = await apiFetch("/api/ai/quiz", { entityId: topicEntityId });
  return data.quiz ?? data ?? [];
}

/** Short devotional for a topic entity */
export async function generateDevotional(topicEntityId) {
  return apiFetch("/api/ai/devotional", { entityId: topicEntityId });
}

/** Historical/cultural explanation for an entity */
export async function explainHistory(entityId) {
  const data = await apiFetch("/api/ai/explain", { entityId });
  return data.summary ?? data ?? null;
}

/** Cross-references for a piece of content */
export async function suggestCrossReferences(contentId) {
  const data = await apiFetch("/api/ai/cross-references", { contentId });
  return data.refs ?? data ?? [];
}

/** Summarize a theme entity across linked content */
export async function summarizeTopic(themeEntityId) {
  const data = await apiFetch("/api/ai/explain", { entityId: themeEntityId });
  return data.summary ?? "";
}

/** Learning-analytics sink — logs locally */
export function analytics(event, payload = {}) {
  const log = state.get("analytics", []);
  log.push({ event, payload, t: Date.now() });
  state.set("analytics", log.slice(-200));
}
