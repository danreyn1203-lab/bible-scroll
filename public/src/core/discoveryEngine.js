// "Continue Learning" — every card can suggest where to go next.
// Prefers hand-curated `continue` lists (so the flagship topics like Noah or
// David read like a real curriculum); falls back to generic graph traversal
// for every other card so the feature scales to all ~80 content items
// without hand-authoring each one.

import { contentIndex, entityIndex, neighbors } from "../data/graph.js";

function labelFor(kind, ref) {
  if (kind === "content") return contentIndex.get(ref)?.ref || contentIndex.get(ref)?.text?.slice(0, 40);
  if (kind === "entity") return entityIndex.get(ref)?.label;
  return null;
}

/** Returns up to n {label, kind, ref} suggestions for what to explore after this card. */
export function continueLearning(contentId, n = 6) {
  const item = contentIndex.get(contentId);
  if (!item) return [];

  if (item.continue?.length) {
    return item.continue.slice(0, n).map(c => ({ ...c, label: c.label || labelFor(c.kind, c.ref) }));
  }

  // Generic fallback: walk one hop out from each linked entity, collect
  // distinct adjacent entities/content, rank by how many of the source's
  // entities they connect back to (a crude "relevance" signal), dedupe.
  const sourceEntities = (item.links || []);
  const seen = new Set([contentId, ...sourceEntities]);
  const scored = new Map(); // id -> score

  for (const entityId of sourceEntities) {
    for (const neighborId of neighbors(entityId)) {
      if (seen.has(neighborId)) continue;
      scored.set(neighborId, (scored.get(neighborId) || 0) + 1);
    }
  }

  const ranked = Array.from(scored.entries()).sort((a, b) => b[1] - a[1]);
  const out = [];
  for (const [id] of ranked) {
    if (out.length >= n) break;
    if (entityIndex.has(id)) {
      out.push({ label: entityIndex.get(id).label, kind: "entity", ref: id });
    } else if (contentIndex.has(id) && id !== contentId) {
      out.push({ label: contentIndex.get(id).ref, kind: "content", ref: id });
    }
  }
  return out;
}

/** Record interest in a stub topic (future feature not yet built) without faking content. */
export function flagStubInterest(stubRef) {
  return { acknowledged: true, ref: stubRef };
}
