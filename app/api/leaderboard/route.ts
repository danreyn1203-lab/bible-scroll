import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

// Integrity score (inspired by Warren Buffett's character-over-flash philosophy):
// Rewards Bible depth, reading consistency, and community service —
// NOT raw follower counts, post volume, or vanity metrics.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const type = url.searchParams.get("type") || "integrity";
  const limit = Math.min(Number(url.searchParams.get("limit") || 20), 100);

  if (type === "xp") {
    const leaders = await prisma.userXP.findMany({
      orderBy: { totalXP: "desc" },
      take: limit,
      select: { userId: true, totalXP: true, level: true },
    });
    if (!leaders.length) return NextResponse.json([]);

    const users = await prisma.user.findMany({
      where: { id: { in: leaders.map(l => l.userId) }, bannedAt: null },
      select: { id: true, displayName: true, avatarUrl: true },
    });
    const userMap = new Map(users.map(u => [u.id, u]));
    return NextResponse.json(
      leaders
        .filter(l => userMap.has(l.userId))
        .map(l => ({
          ...l,
          displayName: userMap.get(l.userId)?.displayName || "Anonymous",
          avatarUrl: userMap.get(l.userId)?.avatarUrl || null,
        }))
    );
  }

  if (type === "streak") {
    // Real streak proxy: annotations + reading plans (no fake hardcoded data)
    const users = await prisma.user.findMany({
      where: { bannedAt: null },
      take: 200,
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
        _count: { select: { annotations: true, readingPlans: true } },
      },
    });

    const scored = users
      .map(u => ({
        id: u.id,
        displayName: u.displayName || "Anonymous",
        avatarUrl: u.avatarUrl || null,
        streakDays: Math.min(u._count.annotations + u._count.readingPlans * 7, 365),
      }))
      .filter(u => u.streakDays > 0)
      .sort((a, b) => b.streakDays - a.streakDays)
      .slice(0, limit);

    return NextResponse.json(scored);
  }

  if (type === "social") {
    const topSocial = await prisma.user.findMany({
      where: { bannedAt: null },
      take: 200,
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
        _count: { select: { posts: true } },
        posts: { select: { _count: { select: { likes: true, comments: true } } }, take: 50 },
      },
    });

    const scored = topSocial
      .map(u => {
        const totalLikes = u.posts.reduce((s, p) => s + p._count.likes, 0);
        const totalComments = u.posts.reduce((s, p) => s + p._count.comments, 0);
        return {
          id: u.id,
          displayName: u.displayName || "Anonymous",
          avatarUrl: u.avatarUrl || null,
          likes: totalLikes,
          comments: totalComments,
          posts: u._count.posts,
        };
      })
      .filter(u => u.likes + u.comments > 0)
      .sort((a, b) => (b.likes + b.comments * 2) - (a.likes + a.comments * 2))
      .slice(0, limit);

    return NextResponse.json(scored);
  }

  // Default: "integrity" — character-based score
  // Components:
  //   Bible depth   = annotations×3 + saves×2  (studying & cherishing Scripture)
  //   Commitment    = readingPlans×10           (sustained, structured devotion)
  //   Community     = comments×2 + prayers×5   (serving others, not self)
  //   Tenure        = up to 20 pts for longevity (Buffett: trust compounds over time)
  const users = await prisma.user.findMany({
    where: { bannedAt: null },
    take: 500,
    select: {
      id: true,
      displayName: true,
      avatarUrl: true,
      createdAt: true,
      _count: {
        select: {
          annotations: true,
          saves: true,
          comments: true,
          readingPlans: true,
          prayerRequests: true,
        },
      },
    },
  });

  const scored = users
    .map(u => {
      const bibleDepth = u._count.annotations * 3 + u._count.saves * 2;
      const commitment = u._count.readingPlans * 10;
      const community = u._count.comments * 2 + u._count.prayerRequests * 5;
      const ageMonths = (Date.now() - new Date(u.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30);
      const tenure = Math.min(ageMonths * 2, 20);
      const integrityScore = Math.round(bibleDepth + commitment + community + tenure);
      return {
        id: u.id,
        displayName: u.displayName || "Anonymous",
        avatarUrl: u.avatarUrl || null,
        integrityScore,
      };
    })
    .filter(u => u.integrityScore > 0)
    .sort((a, b) => b.integrityScore - a.integrityScore)
    .slice(0, limit);

  return NextResponse.json(scored);
}
