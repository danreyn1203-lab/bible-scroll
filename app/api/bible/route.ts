import { NextResponse } from "next/server";

const BIBLE_API = "https://bible.helloao.org/api";

// Proxy for the free Bible API — no key required.
// Usage: /api/bible?translation=ESV&book=GEN&chapter=1
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const translation = searchParams.get("translation") || "ESV";
  const book = searchParams.get("book");
  const chapter = searchParams.get("chapter");

  if (!book || !chapter) {
    // Return list of available translations
    const res = await fetch(`${BIBLE_API}/available_translations.json`);
    if (!res.ok) return NextResponse.json({ error: "Bible API unavailable" }, { status: 502 });
    return NextResponse.json(await res.json());
  }

  const res = await fetch(`${BIBLE_API}/${translation}/${book}/${chapter}.json`);
  if (!res.ok) return NextResponse.json({ error: "Chapter not found" }, { status: 404 });

  const data = await res.json();
  return NextResponse.json(data);
}
