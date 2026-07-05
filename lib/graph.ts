// Server-side knowledge-graph traversal — the same shape as Simply Manna's
// src/data/graph.js, but querying Postgres instead of an in-memory array.
// This is what aiClient.ts and future recommendation logic build on.

import { prisma } from "./prisma";

export async function entitiesOf(contentId: string) {
  const links = await prisma.contentEntityLink.findMany({
    where: { contentId },
    include: { entity: true },
  });
  return links.map(l => l.entity);
}

export async function contentLinkedTo(entityId: string) {
  const links = await prisma.contentEntityLink.findMany({
    where: { entityId },
    include: { content: true },
  });
  return links.map(l => l.content);
}

/** One hop out: entities sharing content with this entity, plus directly related content. */
export async function neighborsOfEntity(entityId: string) {
  const links = await prisma.contentEntityLink.findMany({
    where: { contentId: { in: (await contentLinkedTo(entityId)).map(c => c.id) } },
    include: { entity: true },
  });
  const seen = new Set([entityId]);
  const out = [];
  for (const l of links) {
    if (seen.has(l.entityId)) continue;
    seen.add(l.entityId);
    out.push(l.entity);
  }
  return out;
}

export async function relatedContent(contentId: string) {
  const [from, to] = await Promise.all([
    prisma.contentRelated.findMany({ where: { fromId: contentId }, include: { to: true } }),
    prisma.contentRelated.findMany({ where: { toId: contentId }, include: { from: true } }),
  ]);
  const seen = new Set([contentId]);
  const out = [];
  for (const r of from) { if (!seen.has(r.toId)) { seen.add(r.toId); out.push(r.to); } }
  for (const r of to) { if (!seen.has(r.fromId)) { seen.add(r.fromId); out.push(r.from); } }
  return out;
}

/**
 * Given an entity the user is gravitating toward, find content linked to a
 * *different but graph-adjacent* entity — the same "bridge" idea from
 * Simply Manna's engine.js, so recommendations introduce new topics instead of
 * looping on one.
 */
export async function bridgeFromEntity(entityId: string, excludeContentIds: Set<string> = new Set()) {
  const neighborEntities = await neighborsOfEntity(entityId);
  for (const neighbor of neighborEntities) {
    const items = await contentLinkedTo(neighbor.id);
    const candidates = items.filter(c => !excludeContentIds.has(c.id));
    if (candidates.length) return candidates[Math.floor(Math.random() * candidates.length)];
  }
  return null;
}
