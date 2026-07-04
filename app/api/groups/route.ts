import { NextResponse } from "next/server";
import { auth } from "../../../auth";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const memberships = await prisma.groupMember.findMany({
    where: { userId: session.user.id },
    include: {
      group: {
        include: {
          _count: { select: { members: true, prayerRequests: { where: { status: "visible" } } } },
        },
      },
    },
  });

  return NextResponse.json(
    memberships.map(m => ({
      id: m.group.id,
      name: m.group.name,
      description: m.group.description,
      role: m.role,
      memberCount: m.group._count.members,
      prayerCount: m.group._count.prayerRequests,
      joinedAt: m.joinedAt,
    }))
  );
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { name, description } = await req.json();
  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const group = await prisma.group.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      createdById: session.user.id,
      members: { create: { userId: session.user.id, role: "admin" } },
    },
  });

  return NextResponse.json(group, { status: 201 });
}
