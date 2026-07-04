import { NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { prisma } from "../../../../lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { id } = await params;
  const plan = await prisma.readingPlan.findUnique({ where: { id } });
  if (!plan || plan.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { progress } = await req.json();
  if (typeof progress !== "number" || progress < 0 || progress > plan.days) {
    return NextResponse.json({ error: "Invalid progress value" }, { status: 400 });
  }

  const updated = await prisma.readingPlan.update({
    where: { id },
    data: { progress },
  });

  return NextResponse.json({ ...updated, plan: JSON.parse(updated.plan) });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { id } = await params;
  const plan = await prisma.readingPlan.findUnique({ where: { id } });
  if (!plan || plan.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.readingPlan.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
