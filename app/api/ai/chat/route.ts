import { NextResponse } from "next/server";
import { chat } from "../../../../lib/aiClient";
import { handleAIError } from "../../../../lib/openai";
import { requirePremium } from "../../../../lib/premiumGuard";

export async function POST(req: Request) {
  const guard = await requirePremium();
  if (!guard.ok) return guard.response;

  const { message } = await req.json();
  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }
  try { return NextResponse.json(await chat(message)); }
  catch (e) { return handleAIError(e); }
}
