// One-off, safe fix for the two feed cards that were missing from the DB
// (f.chariots, h.carmel) and the 5 entities they reference. Uses the raw `pg`
// driver so it runs under Node — the generated Prisma client is built for
// Cloudflare's workerd runtime and can't run here.
//
// Every statement is an idempotent upsert (INSERT ... ON CONFLICT). Nothing is
// ever deleted. Existing users, likes, and saves are untouched.
//
//   Run from the project root:  node prisma/seed-fix.mjs

import "dotenv/config";
import pg from "pg";

const ENTITIES = [
  { id: "book.1kings", type: "book", label: "1 Kings", summary: "Solomon's glory, the kingdom's split, and the ministry of Elijah." },
  { id: "person.elijah", type: "person", label: "Elijah", summary: "Fiery prophet who confronted Baal worship and was taken up in a whirlwind." },
  { id: "person.elisha", type: "person", label: "Elisha", summary: "Elijah's successor, who inherited a double portion of his spirit and worked many miracles." },
  { id: "person.ahab", type: "person", label: "Ahab", summary: "Idolatrous king of the northern kingdom, opposed by the prophet Elijah." },
  { id: "place.carmel", type: "place", label: "Mount Carmel", summary: "The mountain ridge where Elijah faced down the prophets of Baal and fire fell from heaven." },
];

const CONTENT = [
  {
    id: "h.carmel", category: "history", ref: "1 Kings 18",
    text: "On Mount Carmel, the prophet <strong>Elijah</strong> challenged 450 prophets of Baal to a contest: whichever god answered with fire was the true God. After Baal stayed silent all day, Elijah drenched his altar with water — and fire fell from heaven and consumed it.",
    links: ["person.elijah", "person.ahab", "place.carmel", "book.1kings", "period.monarchy"],
  },
  {
    id: "f.chariots", category: "funfact", ref: "2 Kings 2:11",
    text: "Elijah never died an ordinary death — he was carried to heaven in a <strong>whirlwind by chariots of fire</strong>, dropping his mantle to his successor Elisha, who had asked for a double portion of his spirit.",
    links: ["person.elijah", "person.elisha", "book.2kings", "period.monarchy"],
  },
];

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();

  for (const e of ENTITIES) {
    await client.query(
      `INSERT INTO "Entity" (id, type, label, summary)
       VALUES ($1, $2::"EntityType", $3, $4)
       ON CONFLICT (id) DO UPDATE
         SET type = EXCLUDED.type, label = EXCLUDED.label, summary = EXCLUDED.summary`,
      [e.id, e.type, e.label, e.summary],
    );
  }
  console.log(`✓ ${ENTITIES.length} entities upserted`);

  for (const c of CONTENT) {
    await client.query(
      `INSERT INTO "Content" (id, category, text, answer, ref)
       VALUES ($1, $2::"ContentCategory", $3, NULL, $4)
       ON CONFLICT (id) DO UPDATE
         SET category = EXCLUDED.category, text = EXCLUDED.text, ref = EXCLUDED.ref`,
      [c.id, c.category, c.text, c.ref],
    );
    for (const entityId of c.links) {
      await client.query(
        `INSERT INTO "ContentEntityLink" ("contentId", "entityId")
         VALUES ($1, $2)
         ON CONFLICT ("contentId", "entityId") DO NOTHING`,
        [c.id, entityId],
      );
    }
  }
  console.log(`✓ ${CONTENT.length} content cards upserted with their entity links`);

  // Verify the two cards are now present.
  const { rows } = await client.query(
    `SELECT id FROM "Content" WHERE id = ANY($1) ORDER BY id`,
    [CONTENT.map(c => c.id)],
  );
  console.log("✓ verified in DB:", rows.map(r => r.id).join(", ") || "(none — check for errors above)");
}

main()
  .then(() => console.log("Done. Hearts & saves will now work on those cards."))
  .catch(err => { console.error("FAILED:", err.message); process.exitCode = 1; })
  .finally(() => client.end());
