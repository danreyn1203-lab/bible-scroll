import { NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { prisma } from "../../../../lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ likes: {}, saves: {} });

  const ids = new URL(req.url).searchParams.get("ids")?.split(",") || [];
  const [likes, saves] = await Promise.all([
    prisma.userLike.findMany({
      where: { userId: session.user.id, contentId: { in: ids } },
      select: { contentId: true },
    }),
    prisma.userSave.findMany({
      where: { userId: session.user.id, contentId: { in: ids } },
      select: { contentId: true },
    }),
  ]);

  const likesMap = Object.fromEntries(likes.map(l => [l.contentId, true]));
  const savesMap = Object.fromEntries(saves.map(s => [s.contentId, true]));
  return NextResponse.json({ likes: likesMap, saves: savesMap });
}
