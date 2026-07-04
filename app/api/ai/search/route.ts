import { NextResponse } from "next/server";
import { semanticSearch } from "../../../../lib/aiClient";
import { handleAIError } from "../../../../lib/openai";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q");
  if (!q) return NextResponse.json({ error: "q is required" }, { status: 400 });
  try { return NextResponse.json(await semanticSearch(q)); }
  catch (e) { return handleAIError(e); }
}
