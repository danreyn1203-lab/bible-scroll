// All seven functions call GPT-5.4-mini via lib/openai.ts. Local graph helpers
// stay as the retrieval layer — we feed grounding context into prompts so the
// model answers from the project's own knowledge graph rather than free recall.
// If OPENAI_API_KEY is missing, requireAI() throws and routes return 503.

import { prisma } from "./prisma";
import { contentLinkedTo, relatedContent } from "./graph";
import { callModel, requireAI } from "./openai";

export async function chat(message: string) {
  requireAI();
  const entities = await prisma.entity.findMany({ take: 30 });
  const context = entities.map(e => ({ id: e.id, label: e.label, summary: e.summary }));
  const res = await callModel({
    system: "You are a thoughtful Bible study companion. Use the provided entities as grounding. If none fit, say so honestly. Respond as JSON: { text: string, sourceEntity: string | null }.",
    user: `Question: ${message}\n\nEntities:\n${JSON.stringify(context)}`,
    json: true,
  }) as { text: string; sourceEntity: string | null };
  return res;
}

export async function semanticSearch(query: string) {
  requireAI();
  const [content, entities] = await Promise.all([
    prisma.content.findMany({ where: { OR: [{ text: { contains: query, mode: "insensitive" } }, { ref: { contains: query, mode: "insensitive" } }] }, take: 30 }),
    prisma.entity.findMany({ where: { OR: [{ label: { contains: query, mode: "insensitive" } }, { summary: { contains: query, mode: "insensitive" } }] }, take: 30 }),
  ]);
  const res = await callModel({
    system: "Rank the candidates by relevance to the query. Return JSON: { contentIds: string[], entityIds: string[] } with up to 10 of each, most relevant first.",
    user: `Query: ${query}\n\nContent:\n${JSON.stringify(content.map(c => ({ id: c.id, ref: c.ref, text: c.text.slice(0, 120) })))}\n\nEntities:\n${JSON.stringify(entities.map(e => ({ id: e.id, label: e.label })))}`,
    json: true,
  }) as { contentIds: string[]; entityIds: string[] };
  const cMap = new Map(content.map(c => [c.id, c]));
  const eMap = new Map(entities.map(e => [e.id, e]));
  return {
    content: (res.contentIds || []).map(id => cMap.get(id)).filter(Boolean),
    entities: (res.entityIds || []).map(id => eMap.get(id)).filter(Boolean),
  };
}

export async function generateStudyPlan(goalEntityId: string, days = 5) {
  requireAI();
  const entity = await prisma.entity.findUnique({ where: { id: goalEntityId } });
  if (!entity) return [];
  const candidates = await contentLinkedTo(goalEntityId);
  const res = await callModel({
    system: `Design a ${days}-day study plan. Return JSON: { plan: [{ contentId: string, why: string }] } ordered for progressive understanding.`,
    user: `Goal: ${entity.label} — ${entity.summary}\n\nCandidates:\n${JSON.stringify(candidates.map(c => ({ id: c.id, ref: c.ref, text: c.text.slice(0, 100) })))}`,
    json: true,
  }) as { plan: { contentId: string; why: string }[] };
  const map = new Map(candidates.map(c => [c.id, c]));
  return (res.plan || []).slice(0, days).map(p => ({ ...map.get(p.contentId)!, why: p.why })).filter(p => p.id);
}

export async function generateQuiz(topicEntityId: string) {
  requireAI();
  const entity = await prisma.entity.findUnique({ where: { id: topicEntityId } });
  if (!entity) return [];
  const items = (await contentLinkedTo(topicEntityId)).slice(0, 5);
  const res = await callModel({
    system: "Write 3 quiz questions that test understanding, not memorization. Return JSON: { quiz: [{ question: string, answer: string }] }.",
    user: `Topic: ${entity.label} — ${entity.summary}\n\nReadings:\n${JSON.stringify(items.map(i => ({ ref: i.ref, text: i.text.slice(0, 200) })))}`,
    json: true,
  }) as { quiz: { question: string; answer: string }[] };
  return res.quiz || [];
}

export async function generateDevotional(topicEntityId: string) {
  requireAI();
  const entity = await prisma.entity.findUnique({ where: { id: topicEntityId } });
  if (!entity) return null;
  const items = (await contentLinkedTo(topicEntityId)).slice(0, 3);
  const res = await callModel({
    system: "Write a short devotional (≤120 words body). Return JSON: { title: string, body: string, readings: string[] } where readings are scripture refs.",
    user: `Topic: ${entity.label} — ${entity.summary}\n\nReadings:\n${JSON.stringify(items.map(i => ({ ref: i.ref, text: i.text })))}`,
    json: true,
  }) as { title: string; body: string; readings: string[] };
  return res;
}

export async function explainHistory(entityId: string) {
  requireAI();
  const entity = await prisma.entity.findUnique({ where: { id: entityId } });
  if (!entity) return null;
  return await callModel({
    system: "Explain the historical and cultural context in 2 paragraphs, accessible to a curious reader.",
    user: `${entity.label}: ${entity.summary}`,
  }) as string;
}

export async function suggestCrossReferences(contentId: string) {
  requireAI();
  const source = await prisma.content.findUnique({ where: { id: contentId } });
  if (!source) return [];
  const candidates = await relatedContent(contentId);
  const res = await callModel({
    system: "Pick the 3 strongest cross-references and explain each link. Return JSON: { refs: [{ contentId: string, why: string }] }.",
    user: `Source: ${source.ref} — ${source.text}\n\nCandidates:\n${JSON.stringify(candidates.map(c => ({ id: c.id, ref: c.ref, text: c.text.slice(0, 150) })))}`,
    json: true,
  }) as { refs: { contentId: string; why: string }[] };
  const map = new Map(candidates.map(c => [c.id, c]));
  return (res.refs || []).map(r => ({ ...map.get(r.contentId)!, why: r.why })).filter(r => r.id);
}

export async function summarizeTopic(themeEntityId: string) {
  requireAI();
  const entity = await prisma.entity.findUnique({ where: { id: themeEntityId } });
  const items = await contentLinkedTo(themeEntityId);
  return await callModel({
    system: "Summarize the theme across these passages in a single tight paragraph.",
    user: `Theme: ${entity?.label}\n\nPassages:\n${items.map(i => `${i.ref}: ${i.text.replace(/<[^>]+>/g, "")}`).join("\n")}`,
  }) as string;
}
