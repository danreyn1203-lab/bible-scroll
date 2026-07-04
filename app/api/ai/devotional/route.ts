import { NextResponse } from "next/server";
import { generateDevotional } from "../../../../lib/aiClient";
import { handleAIError } from "../../../../lib/openai";
import { requirePremium } from "../../../../lib/premiumGuard";

export async function GET(req: Request) {
  const guard = await requirePremium();
  if (!guard.ok) return guard.response;
  const entityId = new URL(req.url).searchParams.get("entityId");
  if (!entityId) return NextResponse.json({ error: "entityId is required" }, { status: 400 });
  try {
    const devotional = await generateDevotional(entityId);
    if (!devotional) return NextResponse.json({ error: "Unknown entity" }, { status: 404 });
    return NextResponse.json(devotional);
  } catch (e) { return handleAIError(e); }
}
