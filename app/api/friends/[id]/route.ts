import { NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { prisma } from "../../../../lib/prisma";

// Accept a pending friend request
export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { id } = await params;
  const friendship = await prisma.friendship.findUnique({ where: { id } });
  if (!friendship || friendship.toId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (friendship.status !== "pending") {
    return NextResponse.json({ error: "Already accepted" }, { status: 400 });
  }

  const updated = await prisma.friendship.update({
    where: { id },
    data: { status: "accepted" },
  });

  return NextResponse.json({ id: updated.id, status: updated.status });
}

// Decline or unfriend
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { id } = await params;
  const friendship = await prisma.friendship.findUnique({ where: { id } });
  if (!friendship || (friendship.fromId !== session.user.id && friendship.toId !== session.user.id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.friendship.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
