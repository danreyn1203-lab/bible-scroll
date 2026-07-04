import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";

// Public aggregate counts — no auth required, no per-user info exposed.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const content = await prisma.content.findUnique({ where: { id } });
  if (!content) return NextResponse.json({ error: "Unknown content" }, { status: 404 });

  const [likes, saves, comments] = await Promise.all([
    prisma.userLike.count({ where: { contentId: id } }),
    prisma.userSave.count({ where: { contentId: id } }),
    prisma.comment.count({ where: { contentId: id, status: "visible" } }),
  ]);
  return NextResponse.json({ contentId: id, likes, saves, comments });
}
