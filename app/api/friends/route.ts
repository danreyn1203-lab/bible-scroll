import { NextResponse } from "next/server";
import { auth } from "../../../auth";
import { prisma } from "../../../lib/prisma";

// GET: list user's friends and pending requests
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const userId = session.user.id;

  const [accepted, pending, requests] = await Promise.all([
    // Friends (both directions)
    prisma.friendship.findMany({
      where: {
        OR: [{ fromId: userId, status: "accepted" }, { toId: userId, status: "accepted" }],
      },
      include: {
        from: { select: { id: true, displayName: true, email: true, avatarUrl: true } },
        to: { select: { id: true, displayName: true, email: true, avatarUrl: true } },
      },
    }),
    // Pending requests sent by me
    prisma.friendship.findMany({
      where: { fromId: userId, status: "pending" },
      include: {
        to: { select: { id: true, displayName: true, email: true, avatarUrl: true } },
      },
    }),
    // Pending requests received by me
    prisma.friendship.findMany({
      where: { toId: userId, status: "pending" },
      include: {
        from: { select: { id: true, displayName: true, email: true, avatarUrl: true } },
      },
    }),
  ]);

  // Format friends
  const friends = accepted.map(f => {
    const other = f.fromId === userId ? f.to : f.from;
    return { id: other.id, displayName: other.displayName, email: other.email, avatarUrl: other.avatarUrl };
  });

  const outgoing = pending.map(f => ({
    id: f.to.id,
    displayName: f.to.displayName,
    email: f.to.email,
    avatarUrl: f.to.avatarUrl,
    status: "pending_out",
  }));

  const incoming = requests.map(f => ({
    id: f.from.id,
    displayName: f.from.displayName,
    email: f.from.email,
    avatarUrl: f.from.avatarUrl,
    status: "pending_in",
    requestId: f.id,
  }));

  return NextResponse.json({ friends, outgoing, incoming });
}

// POST: send friend request or respond to pending request
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { targetUserId, action } = await req.json();
  const userId = session.user.id;

  if (!targetUserId) return NextResponse.json({ error: "targetUserId required" }, { status: 400 });
  if (userId === targetUserId) return NextResponse.json({ error: "Can't friend yourself" }, { status: 400 });

  if (action === "send") {
    // Check if request already exists
    const existing = await prisma.friendship.findUnique({
      where: { fromId_toId: { fromId: userId, toId: targetUserId } },
    });
    if (existing) return NextResponse.json({ error: "Request already sent" }, { status: 400 });

    await prisma.friendship.create({
      data: { fromId: userId, toId: targetUserId, status: "pending" },
    });
    return NextResponse.json({ success: true, action: "request_sent" });
  }

  if (action === "accept") {
    const friendship = await prisma.friendship.findUnique({
      where: { fromId_toId: { fromId: targetUserId, toId: userId } },
    });
    if (!friendship) return NextResponse.json({ error: "Request not found" }, { status: 404 });
    if (friendship.status !== "pending") return NextResponse.json({ error: "Already accepted" }, { status: 400 });

    await prisma.friendship.update({
      where: { fromId_toId: { fromId: targetUserId, toId: userId } },
      data: { status: "accepted" },
    });
    return NextResponse.json({ success: true, action: "accepted" });
  }

  if (action === "decline") {
    await prisma.friendship.deleteMany({
      where: {
        OR: [
          { fromId: userId, toId: targetUserId },
          { fromId: targetUserId, toId: userId },
        ],
      },
    });
    return NextResponse.json({ success: true, action: "declined" });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
