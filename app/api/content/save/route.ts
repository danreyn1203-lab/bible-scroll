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

  const existing = await prisma.userSave.findUnique({
    where: { userId_contentId: { userId: session.user.id, contentId } },
  });

  if (existing) {
    await prisma.userSave.delete({
      where: { userId_contentId: { userId: session.user.id, contentId } },
    });
  } else {
    await prisma.userSave.create({
      data: { userId: session.user.id, contentId },
    });
  }
  const count = await prisma.userSave.count({ where: { contentId } });
  return NextResponse.json({ saved: !existing, count });
}
