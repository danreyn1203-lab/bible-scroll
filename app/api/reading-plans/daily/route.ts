import { NextResponse } from "next/server";

const BIBLE_API = "https://bible.helloao.org/api";

// UI translation codes -> real translation IDs on bible.helloao.org.
// These are all public-domain and freely hosted (no key needed).
const TRANSLATION_MAP: Record<string, string> = {
  KJV: "eng_kjv",   // King James (Authorized) Version
  WEB: "ENGWEBP",   // World English Bible — modern, ESV-adjacent readability
  BSB: "BSB",       // Berean Standard Bible — modern evangelical phrasing
  ASV: "eng_asv",   // American Standard Version — classic literal
  YLT: "eng_ylt",   // Young's Literal Translation — most literal
};

// ESV is commercially licensed by Crossway and is NOT on the free public-domain
// API above. Serving real ESV text requires Crossway's own API and a (free)
// key from https://api.esv.org/ — set it as ESV_API_KEY. Without a key we
// report `needsKey` so the UI can explain instead of silently showing nothing.
const ESV_API = "https://api.esv.org/v3/passage/text/";

function parseEsvPassage(passage: string): { number: number; text: string }[] {
  // ESV returns one string with inline "[1] ... [2] ..." verse markers.
  const parts = passage.split(/\[(\d+)\]/).slice(1); // -> [num, text, num, text, ...]
  const verses: { number: number; text: string }[] = [];
  for (let i = 0; i + 1 < parts.length; i += 2) {
    const number = parseInt(parts[i], 10);
    const text = parts[i + 1].replace(/\s+/g, " ").trim();
    if (text) verses.push({ number, text });
  }
  return verses;
}

// A curated 365-day reading plan: book + chapter for each day
// Cycles through the whole Bible roughly chronologically
const PLAN: { book: string; chapter: number; name: string }[] = [
  // Genesis
  ...Array.from({ length: 50 }, (_, i) => ({ book: "GEN", chapter: i + 1, name: "Genesis" })),
  // Exodus
  ...Array.from({ length: 40 }, (_, i) => ({ book: "EXO", chapter: i + 1, name: "Exodus" })),
  // Psalms (interspersed)
  ...Array.from({ length: 50 }, (_, i) => ({ book: "PSA", chapter: i + 1, name: "Psalms" })),
  // Proverbs
  ...Array.from({ length: 31 }, (_, i) => ({ book: "PRO", chapter: i + 1, name: "Proverbs" })),
  // Isaiah
  ...Array.from({ length: 66 }, (_, i) => ({ book: "ISA", chapter: i + 1, name: "Isaiah" })),
  // Matthew
  ...Array.from({ length: 28 }, (_, i) => ({ book: "MAT", chapter: i + 1, name: "Matthew" })),
  // John
  ...Array.from({ length: 21 }, (_, i) => ({ book: "JHN", chapter: i + 1, name: "John" })),
  // Romans
  ...Array.from({ length: 16 }, (_, i) => ({ book: "ROM", chapter: i + 1, name: "Romans" })),
  // Revelation
  ...Array.from({ length: 22 }, (_, i) => ({ book: "REV", chapter: i + 1, name: "Revelation" })),
];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const translation = searchParams.get("translation") || "KJV";
  const apiTranslationId = TRANSLATION_MAP[translation] || TRANSLATION_MAP.KJV;
  const dayParam = searchParams.get("day");

  // Default to today's day of year (0-indexed into plan)
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000);
  const dayIndex = dayParam ? parseInt(dayParam) - 1 : dayOfYear % PLAN.length;

  const today = PLAN[dayIndex % PLAN.length];
  const tomorrow = PLAN[(dayIndex + 1) % PLAN.length];

  // Fetch today's chapter — ESV goes through Crossway's API, everything else
  // through the free public-domain API.
  let verses: { number: number; text: string }[] = [];
  let needsKey = false;
  try {
    if (translation === "ESV") {
      const key = process.env.ESV_API_KEY;
      if (!key) {
        needsKey = true;
      } else {
        const q = encodeURIComponent(`${today.name} ${today.chapter}`);
        const url = `${ESV_API}?q=${q}&include-headings=false&include-footnotes=false`
          + `&include-passage-references=false&include-short-copyright=false&include-verse-numbers=true`;
        const res = await fetch(url, { headers: { Authorization: `Token ${key}` } });
        if (res.ok) {
          const data = await res.json();
          const passage = Array.isArray(data.passages) ? data.passages[0] || "" : "";
          verses = parseEsvPassage(passage);
        }
      }
    } else {
      const res = await fetch(`${BIBLE_API}/${apiTranslationId}/${today.book}/${today.chapter}.json`);
      if (res.ok) {
        const data = await res.json();
        const content: { type: string; number: number; content: (string | object)[] }[] = data?.chapter?.content ?? [];
        verses = content
          .filter(item => item.type === "verse")
          .map(item => ({
            number: item.number,
            text: item.content.filter((part): part is string => typeof part === "string").join(" "),
          }));
      }
    }
  } catch (_) {}

  return NextResponse.json({
    day: dayIndex + 1,
    total: PLAN.length,
    translation,
    today: {
      book: today.name,
      bookCode: today.book,
      chapter: today.chapter,
      reference: `${today.name} ${today.chapter}`,
      verses,
      needsKey,
    },
    tomorrow: {
      reference: `${tomorrow.name} ${tomorrow.chapter}`,
    },
  });
}
