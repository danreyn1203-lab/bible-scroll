import { NextResponse } from "next/server";

const BIBLE_API = "https://bible.helloao.org/api";

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
  const translation = searchParams.get("translation") || "ESV";
  const dayParam = searchParams.get("day");

  // Default to today's day of year (0-indexed into plan)
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000);
  const dayIndex = dayParam ? parseInt(dayParam) - 1 : dayOfYear % PLAN.length;

  const today = PLAN[dayIndex % PLAN.length];
  const tomorrow = PLAN[(dayIndex + 1) % PLAN.length];

  // Fetch today's chapter from Bible API
  let verses: { number: number; text: string }[] = [];
  try {
    const res = await fetch(`${BIBLE_API}/${translation}/${today.book}/${today.chapter}.json`);
    if (res.ok) {
      const data = await res.json();
      verses = (data.verses ?? []).map((v: { number: number; text: string }) => ({
        number: v.number,
        text: v.text,
      }));
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
    },
    tomorrow: {
      reference: `${tomorrow.name} ${tomorrow.chapter}`,
    },
  });
}
