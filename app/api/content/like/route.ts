import { NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { prisma } from "../../../../lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { contentId } = await req.json();
  if (!contentId || typeof contentId !== "string") {
    return NextResponse.json({ error: "contentId is required" }, { status: 400 });
  }

  const content = await prisma.content.findUnique({ where: { id: contentId } });
  if (!content) return NextResponse.json({ error: "Unknown content" }, { status: 404 });

  const existing = await prisma.userLike.findUnique({
    where: { userId_contentId: { userId: session.user.id, contentId } },
  });

  let liked: boolean;
  try {
    if (existing) {
      await prisma.userLike.delete({
        where: { userId_contentId: { userId: session.user.id, contentId } },
      });
      liked = false;
    } else {
      await prisma.userLike.create({
        data: { userId: session.user.id, contentId },
      });
      liked = true;
    }
  } catch {
    // Two rapid toggles raced (e.g. a quick double-click) — the delete/create
    // above may have hit a record another in-flight request already changed.
    // Re-check actual state instead of crashing with a 500.
    const stillExists = await prisma.userLike.findUnique({
      where: { userId_contentId: { userId: session.user.id, contentId } },
    });
    liked = !!stillExists;
  }

  const count = await prisma.userLike.count({ where: { contentId } });
  return NextResponse.json({ liked, count });
}
