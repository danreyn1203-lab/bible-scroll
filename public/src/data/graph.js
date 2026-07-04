// Builds the traversable knowledge graph from content.js + entities.js.
// Nodes: every content item AND every entity share one id-space.
// Edges: derived from `links` (content -> entity) and `related` (content <-> content),
// plus implicit entity co-occurrence (two entities linked from the same content item
// are "associated" — this is what lets the engine bridge "Romans" to "Galatians"
// even though no one hand-authored that specific link).

import { CONTENT, contentIndex, CATS } from "./content.js";
import { ENTITIES, entityIndex } from "./entities.js";

const adjacency = new Map(); // id -> Set<id>

function link(a, b) {
  if (a === b) return;
  if (!adjacency.has(a)) adjacency.set(a, new Set());
  if (!adjacency.has(b)) adjacency.set(b, new Set());
  adjacency.get(a).add(b);
  adjacency.get(b).add(a);
}

function build() {
  for (const item of CONTENT) {
    (item.links || []).forEach(eid => link(item.id, eid));
    (item.related || []).forEach(rid => link(item.id, rid));
    // entity co-occurrence: things mentioned together are associated
    const links = item.links || [];
    for (let i = 0; i < links.length; i++) {
      for (let j = i + 1; j < links.length; j++) link(links[i], links[j]);
    }
  }
}
build();

export function neighbors(id) {
  return Array.from(adjacency.get(id) || []);
}

export function entitiesOf(contentId) {
  const item = contentIndex.get(contentId);
  if (!item) return [];
  return (item.links || []).map(id => entityIndex.get(id)).filter(Boolean);
}

export function contentLinkedTo(entityId) {
  return CONTENT.filter(c => (c.links || []).includes(entityId));
}

// Breadth-first search for the shortest path between two nodes (content or entity).
// Used by the recommendation engine to find a "bridge" item that connects a
// user's current interest to something adjacent-but-unexplored, rather than
// just recommending more of the same thing.
export function shortestPath(fromId, toId, maxDepth = 4) {
  if (fromId === toId) return [fromId];
  const visited = new Set([fromId]);
  let frontier = [[fromId]];
  let depth = 0;
  while (frontier.length && depth < maxDepth) {
    const next = [];
    for (const path of frontier) {
      const last = path[path.length - 1];
      for (const n of neighbors(last)) {
        if (visited.has(n)) continue;
        const newPath = [...path, n];
        if (n === toId) return newPath;
        visited.add(n);
        next.push(newPath);
      }
    }
    frontier = next;
    depth++;
  }
  return null;
}

// Given an entity id the user is gravitating toward, find a content item that
// links to a *different but graph-adjacent* entity — i.e. a sensible "next topic."
export function bridgeFrom(entityId, excludeContentIds = new Set()) {
  const candidates = [];
  for (const neighborId of neighbors(entityId)) {
    // neighborId might be another entity (sibling topic) or content
    for (const c of contentLinkedTo(neighborId)) {
      if (excludeContentIds.has(c.id)) continue;
      if ((c.links || []).includes(entityId)) continue; // skip items already tied to the source entity
      candidates.push(c);
    }
  }
  return candidates.length ? candidates[Math.floor(Math.random() * candidates.length)] : null;
}

export { CONTENT, contentIndex, CATS, ENTITIES, entityIndex };
