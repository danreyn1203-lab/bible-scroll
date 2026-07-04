import { NextResponse } from "next/server";
import { auth } from "../../../auth";
import { prisma } from "../../../lib/prisma";
import { generateStudyPlan } from "../../../lib/aiClient";
import { handleAIError } from "../../../lib/openai";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const plans = await prisma.readingPlan.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { entity: { select: { label: true, type: true } } },
  });

  return NextResponse.json(
    plans.map(p => ({ ...p, plan: JSON.parse(p.plan) }))
  );
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { entityId, days = 5 } = await req.json();
  if (!entityId || typeof entityId !== "string") {
    return NextResponse.json({ error: "entityId is required" }, { status: 400 });
  }

  const entity = await prisma.entity.findUnique({ where: { id: entityId } });
  if (!entity) return NextResponse.json({ error: "Unknown entity" }, { status: 404 });

  let items;
  try { items = await generateStudyPlan(entityId, days); }
  catch (e) { return handleAIError(e); }
  const planData = items.map((item, i) => ({
    day: i + 1,
    contentId: item.id,
    category: item.category,
    text: item.text.replace(/<[^>]+>/g, "").slice(0, 200),
    ref: item.ref,
  }));

  const plan = await prisma.readingPlan.create({
    data: {
      userId: session.user.id,
      title: `${entity.label} — ${days}-day plan`,
      entityId,
      days,
      plan: JSON.stringify(planData),
    },
  });

  return NextResponse.json({ ...plan, plan: planData }, { status: 201 });
}
