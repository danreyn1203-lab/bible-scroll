import { NextResponse } from "next/server";
import { auth } from "../../../auth";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const interests = await prisma.userInterest.findMany({
    where: { userId: session.user.id },
    include: { entity: { select: { id: true, label: true, type: true } } },
  });
  return NextResponse.json(interests.map(i => i.entity));
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { entityIds } = await req.json();
  if (!Array.isArray(entityIds)) {
    return NextResponse.json({ error: "entityIds must be an array" }, { status: 400 });
  }

  // Clear old interests and set new ones
  await prisma.userInterest.deleteMany({ where: { userId: session.user.id } });

  const validEntities = await prisma.entity.findMany({
    where: { id: { in: entityIds } },
    select: { id: true },
  });

  if (validEntities.length > 0) {
    await prisma.userInterest.createMany({
      data: validEntities.map(e => ({ userId: session.user!.id!, entityId: e.id })),
    });
  }

  return NextResponse.json({ saved: validEntities.length });
}
