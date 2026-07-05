// Ports the Simply Manna prototype's hand-authored knowledge graph (entities.js +
// content.js) into the real database. Run with: npx tsx prisma/seed.ts

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, EntityType, ContentCategory } from "../app/generated/prisma/client";
import { ENTITIES } from "./seedData/entities";
import { CONTENT } from "./seedData/content";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log(`Seeding ${ENTITIES.length} entities...`);
  for (const e of ENTITIES) {
    await prisma.entity.upsert({
      where: { id: e.id },
      create: { id: e.id, type: e.type as EntityType, label: e.label, summary: e.summary },
      update: { type: e.type as EntityType, label: e.label, summary: e.summary },
    });
  }

  console.log(`Seeding ${CONTENT.length} content items...`);
  for (const c of CONTENT) {
    await prisma.content.upsert({
      where: { id: c.id },
      create: { id: c.id, category: c.c as ContentCategory, text: c.text, answer: c.answer ?? null, ref: c.ref },
      update: { category: c.c as ContentCategory, text: c.text, answer: c.answer ?? null, ref: c.ref },
    });
  }

  console.log("Linking content to entities...");
  for (const c of CONTENT) {
    for (const entityId of c.links || []) {
      await prisma.contentEntityLink.upsert({
        where: { contentId_entityId: { contentId: c.id, entityId } },
        create: { contentId: c.id, entityId },
        update: {},
      });
    }
  }

  console.log("Linking related content...");
  for (const c of CONTENT) {
    for (const toId of c.related || []) {
      await prisma.contentRelated.upsert({
        where: { fromId_toId: { fromId: c.id, toId } },
        create: { fromId: c.id, toId },
        update: {},
      });
    }
  }

  console.log("Seed complete.");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
