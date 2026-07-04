import { NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { prisma } from "../../../../lib/prisma";

// Time-decayed trending posts for the Community feed.
// Same algorithm as /api/admin/trending so admins and users see the same signal.
// score = (likes + 2*comments) * 0.5^(age_days/3)
export async function GET() {
  const session = await auth();
  const viewerId = session?.user?.id || null;

  const recent = await prisma.post.findMany({
    take: 200,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, displayName: true, avatarUrl: true } },
      _count: { select: { likes: true, comments: { where: { status: "visible" } } } },
    },
  });

  const now = Date.now();
  const HALF_LIFE_DAYS = 3;
  const scored = recent.map(p => {
    const ageDays = (now - p.createdAt.getTime()) / (24 * 60 * 60 * 1000);
    const decay = Math.pow(0.5, ageDays / HALF_LIFE_DAYS);
    const score = (p._count.likes + 2 * p._count.comments) * decay;
    return { post: p, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, 30);

  // Resolve which ones the viewer has liked, in one query
  const likedSet = new Set<string>();
  if (viewerId && top.length) {
    const likes = await prisma.postLike.findMany({
      where: { userId: viewerId, postId: { in: top.map(t => t.post.id) } },
      select: { postId: true },
    });
    likes.forEach(l => likedSet.add(l.postId));
  }

  return NextResponse.json(
    top.map(({ post: p, score }) => ({
      id: p.id,
      caption: p.caption,
      mediaUrl: p.mediaUrl,
      mediaType: p.mediaType,
      thumbnailUrl: p.thumbnailUrl,
      createdAt: p.createdAt,
      author: { id: p.user.id, displayName: p.user.displayName, avatarUrl: p.user.avatarUrl },
      isOwn: viewerId === p.user.id,
      likeCount: p._count.likes,
      commentCount: p._count.comments,
      liked: likedSet.has(p.id),
      trendScore: Math.round(score * 100) / 100,
    }))
  );
}
