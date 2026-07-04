import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { prisma } from "../../../../../lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { id } = await params;
  const members = await prisma.groupMember.findMany({
    where: { groupId: id },
    include: { user: { select: { id: true, displayName: true } } },
  });

  return NextResponse.json(members.map(m => ({
    userId: m.user.id,
    displayName: m.user.displayName,
    role: m.role,
    joinedAt: m.joinedAt,
  })));
}

// Join a group
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { id } = await params;
  const group = await prisma.group.findUnique({ where: { id } });
  if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

  const existing = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId: session.user.id, groupId: id } },
  });
  if (existing) return NextResponse.json({ error: "Already a member" }, { status: 409 });

  await prisma.groupMember.create({
    data: { userId: session.user.id, groupId: id },
  });

  return NextResponse.json({ joined: true }, { status: 201 });
}
