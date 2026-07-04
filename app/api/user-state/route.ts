import { NextResponse } from "next/server";
import { auth } from "../../../auth";
import { prisma } from "../../../lib/prisma";
import { getStreak } from "../../../lib/streak";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ authenticated: false });

  const [likes, saves, streak] = await Promise.all([
    prisma.userLike.findMany({
      where: { userId: session.user.id },
      select: { contentId: true },
    }),
    prisma.userSave.findMany({
      where: { userId: session.user.id },
      select: { contentId: true },
    }),
    getStreak(session.user.id),
  ]);

  return NextResponse.json({
    authenticated: true,
    user: session.user,
    likedIds: likes.map(l => l.contentId),
    savedIds: saves.map(s => s.contentId),
    streak,
  });
}
