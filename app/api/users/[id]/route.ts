import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

// Public profile — deliberately excludes email and passwordHash. This is
// what comment/annotation author links point to.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, displayName: true, bio: true, avatarUrl: true, createdAt: true },
  });
  if (!user) return NextResponse.json({ error: "Unknown user" }, { status: 404 });

  const [likesGiven, commentsMade] = await Promise.all([
    prisma.userLike.count({ where: { userId: id } }),
    prisma.comment.count({ where: { userId: id, status: "visible" } }),
  ]);

  return NextResponse.json({ ...user, likesGiven, commentsMade });
}
