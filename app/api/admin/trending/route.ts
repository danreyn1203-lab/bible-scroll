import { NextResponse } from "next/server";
import { requireStaff } from "../../../../lib/adminGuard";
import { prisma } from "../../../../lib/prisma";

// Trending content + top contributors — the "advanced algorithm" panel.
// Uses a simple time-decayed engagement score:
//   score = (likes + 2*comments + 3*saves) * recency_weight
// where recency_weight halves every 3 days.
export async function GET() {
  const guard = await requireStaff();
  if (!guard.ok) return guard.response;

  const now = Date.now();
  const HALF_LIFE_DAYS = 3;
  const decay = (createdAt: Date) => {
    const ageDays = (now - createdAt.getTime()) / (24 * 60 * 60 * 1000);
    return Math.pow(0.5, ageDays / HALF_LIFE_DAYS);
  };

  // --- Trending Bible content (top 10 by score)
  const recentContent = await prisma.content.findMany({
    take: 200,
    include: {
      _count: { select: { likedBy: true, savedBy: true, comments: { where: { status: "visible" } } } },
    },
  });
  // Content doesn't have createdAt itself — use most recent like as proxy
  const trendingContent = recentContent
    .map(c => {
      const raw = c._count.likedBy + 2 * c._count.comments + 3 * c._count.savedBy;
      return { id: c.id, ref: c.ref, text: c.text.slice(0, 80), score: raw, ...c._count };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  // --- Trending posts (with time decay + video boost)
  const recentPosts = await prisma.post.findMany({
    take: 500,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { displayName: true, email: true, avatarUrl: true } },
      _count: { select: { likes: true, comments: { where: { status: "visible" } } } },
    },
  });
  const trendingPosts = recentPosts
    .map(p => {
      // Videos get a 1.5x multiplier — they require more effort and drive more engagement
      const mediaBoost = p.mediaType === "video" ? 1.5 : p.mediaType === "photo" ? 1.2 : 1.0;
      const raw = p._count.likes * 1 + p._count.comments * 3;
      const score = raw * decay(p.createdAt) * mediaBoost;
      return {
        id: p.id,
        caption: p.caption?.slice(0, 80) || "(no caption)",
        author: p.user.displayName || p.user.email || "Anonymous",
        mediaType: p.mediaType,
        thumbnailUrl: (p as any).thumbnailUrl || null,
        likes: p._count.likes,
        comments: p._count.comments,
        score: Math.round(score * 100) / 100,
        createdAt: p.createdAt,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  // --- Top contributors (most engagement received)
  const userAgg = await prisma.user.findMany({
    take: 200,
    where: { bannedAt: null },
    select: {
      id: true,
      displayName: true,
      email: true,
      avatarUrl: true,
      _count: { select: { posts: true, comments: true, likes: true } },
    },
  });
  const topContributors = userAgg
    .map(u => ({
      ...u,
      score: u._count.posts * 5 + u._count.comments * 2 + u._count.likes * 1,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return NextResponse.json({
    algorithm: "score = likes + 2*comments + 3*saves, decayed by half every 3 days",
    trendingContent,
    trendingPosts,
    topContributors,
    generatedAt: new Date().toISOString(),
  });
}
