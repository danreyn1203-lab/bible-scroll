import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { prisma } from "../../../../../lib/prisma";
import { checkText } from "../../../../../lib/moderation";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const comments = await prisma.postComment.findMany({
    where: { postId: id, status: "visible" },
    orderBy: { createdAt: "asc" },
    take: 200,
  });
  const userIds = [...new Set(comments.map(c => c.userId))];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, displayName: true, avatarUrl: true },
  });
  const userMap = new Map(users.map(u => [u.id, u]));
  return NextResponse.json(
    comments.map(c => ({
      id: c.id,
      text: c.text,
      createdAt: c.createdAt,
      author: userMap.get(c.userId) || { id: c.userId, displayName: null, avatarUrl: null },
    }))
  );
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { id } = await params;
  const { text } = await req.json();
  if (!text || typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ error: "Comment text is required" }, { status: 400 });
  }

  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  const mod = await checkText(text);
  if (!mod.allowed) {
    return NextResponse.json({ error: "Comment didn't pass moderation", reason: mod.reason }, { status: 422 });
  }

  const comment = await prisma.postComment.create({
    data: { userId: session.user.id, postId: id, text: text.trim(), status: mod.status },
  });
  return NextResponse.json({ id: comment.id, text: comment.text, createdAt: comment.createdAt }, { status: 201 });
}
