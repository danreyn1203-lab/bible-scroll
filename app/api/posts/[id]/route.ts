import { NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";
import { auth } from "../../../../auth";
import { prisma } from "../../../../lib/prisma";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { id } = await params;

  const post = await prisma.post.findUnique({ where: { id } });
  if (!post || post.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (post.mediaUrl?.startsWith("/uploads/posts/")) {
    const file = path.join(process.cwd(), "public", post.mediaUrl);
    await unlink(file).catch(() => {});
  }
  await prisma.post.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
