import { NextResponse } from "next/server";
import { auth } from "../../../auth";
import { prisma } from "../../../lib/prisma";
import { checkText } from "../../../lib/moderation";

// Public listing — only ever returns visible comments, with just enough
// author info to link to a public profile (id + displayName, never email).
export async function GET(req: Request) {
  const contentId = new URL(req.url).searchParams.get("contentId");
  if (!contentId) return NextResponse.json({ error: "contentId is required" }, { status: 400 });

  const comments = await prisma.comment.findMany({
    where: { contentId, status: "visible" },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, displayName: true, avatarUrl: true } } },
  });
  return NextResponse.json(
    comments.map(c => ({
      id: c.id,
      text: c.text,
      createdAt: c.createdAt,
      author: { id: c.user.id, displayName: c.user.displayName, avatarUrl: c.user.avatarUrl, profileUrl: `/api/users/${c.user.id}` },
    }))
  );
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { contentId, text } = await req.json();
  if (!contentId || typeof contentId !== "string" || !text || typeof text !== "string") {
    return NextResponse.json({ error: "contentId and text are required" }, { status: 400 });
  }

  const content = await prisma.content.findUnique({ where: { id: contentId } });
  if (!content) return NextResponse.json({ error: "Unknown content" }, { status: 404 });

  const moderation = await checkText(text);
  if (!moderation.allowed) {
    return NextResponse.json(
      { error: "Comment didn't pass moderation.", reason: moderation.reason },
      { status: 422 }
    );
  }

  const comment = await prisma.comment.create({
    data: { userId: session.user.id, contentId, text: text.trim(), status: moderation.status },
  });
  return NextResponse.json({ id: comment.id, text: comment.text, createdAt: comment.createdAt }, { status: 201 });
}
