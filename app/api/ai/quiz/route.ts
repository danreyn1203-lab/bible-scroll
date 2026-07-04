import { NextResponse } from "next/server";
import { generateQuiz } from "../../../../lib/aiClient";
import { handleAIError } from "../../../../lib/openai";
import { requirePremium } from "../../../../lib/premiumGuard";

export async function GET(req: Request) {
  const guard = await requirePremium();
  if (!guard.ok) return guard.response;
  const entityId = new URL(req.url).searchParams.get("entityId");
  if (!entityId) return NextResponse.json({ error: "entityId is required" }, { status: 400 });
  try { return NextResponse.json(await generateQuiz(entityId)); }
  catch (e) { return handleAIError(e); }
}
