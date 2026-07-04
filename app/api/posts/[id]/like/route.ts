import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { prisma } from "../../../../../lib/prisma";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { id } = await params;

  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  const existing = await prisma.postLike.findUnique({
    where: { userId_postId: { userId: session.user.id, postId: id } },
  });

  if (existing) {
    await prisma.postLike.delete({ where: { userId_postId: { userId: session.user.id, postId: id } } });
  } else {
    await prisma.postLike.create({ data: { userId: session.user.id, postId: id } });
  }

  const count = await prisma.postLike.count({ where: { postId: id } });
  return NextResponse.json({ liked: !existing, count });
}
