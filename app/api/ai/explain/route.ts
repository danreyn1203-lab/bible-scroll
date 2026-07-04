import { NextResponse } from "next/server";
import { explainHistory } from "../../../../lib/aiClient";
import { handleAIError } from "../../../../lib/openai";

export async function GET(req: Request) {
  const entityId = new URL(req.url).searchParams.get("entityId");
  if (!entityId) return NextResponse.json({ error: "entityId is required" }, { status: 400 });
  try {
    const summary = await explainHistory(entityId);
    if (summary === null) return NextResponse.json({ error: "Unknown entity" }, { status: 404 });
    return NextResponse.json({ entityId, summary });
  } catch (e) { return handleAIError(e); }
}
