import { NextResponse } from "next/server";
import { suggestCrossReferences } from "../../../../lib/aiClient";
import { handleAIError } from "../../../../lib/openai";

export async function GET(req: Request) {
  const contentId = new URL(req.url).searchParams.get("contentId");
  if (!contentId) return NextResponse.json({ error: "contentId is required" }, { status: 400 });
  try { return NextResponse.json(await suggestCrossReferences(contentId)); }
  catch (e) { return handleAIError(e); }
}
