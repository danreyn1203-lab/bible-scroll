import { NextResponse } from "next/server";
import { generateStudyPlan } from "../../../../lib/aiClient";
import { prisma } from "../../../../lib/prisma";
import { handleAIError } from "../../../../lib/openai";
import { requirePremium } from "../../../../lib/premiumGuard";

export async function GET(req: Request) {
  const guard = await requirePremium();
  if (!guard.ok) return guard.response;
  const entityId = new URL(req.url).searchParams.get("entityId");
  const days = parseInt(new URL(req.url).searchParams.get("days") || "5");
  if (!entityId) return NextResponse.json({ error: "entityId is required" }, { status: 400 });

  const entity = await prisma.entity.findUnique({ where: { id: entityId } });
  if (!entity) return NextResponse.json({ error: "Unknown entity" }, { status: 404 });

  try {
  const plan = await generateStudyPlan(entityId, days);
  return NextResponse.json({
    topic: entity.label,
    entityId,
    days: plan.map((item, i) => ({
      day: i + 1,
      contentId: item.id,
      category: item.category,
      text: item.text.replace(/<[^>]+>/g, "").slice(0, 200),
      ref: item.ref,
    })),
  });
  } catch (e) { return handleAIError(e); }
}
