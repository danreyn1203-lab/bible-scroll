import { NextResponse } from "next/server";
import { requireStaff } from "../../../../lib/adminGuard";
import { prisma } from "../../../../lib/prisma";

// Aggregate analytics for the admin dashboard.
// Returns top-line counts + recent-activity trends.
export async function GET() {
  const guard = await requireStaff();
  if (!guard.ok) return guard.response;

  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    bannedUsers,
    newUsers24h,
    newUsers7d,
    totalPosts,
    newPosts24h,
    totalComments,
    flaggedComments,
    removedComments,
    pendingReports,
    totalPrayerRequests,
    flaggedPrayers,
    totalLikes,
    totalSaves,
    activeReadingPlans,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { bannedAt: { not: null } } }),
    prisma.user.count({ where: { createdAt: { gte: dayAgo } } }),
    prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.post.count(),
    prisma.post.count({ where: { createdAt: { gte: dayAgo } } }),
    prisma.comment.count(),
    prisma.comment.count({ where: { status: "flagged" } }),
    prisma.comment.count({ where: { status: "removed" } }),
    prisma.contentReport.count(),
    prisma.prayerRequest.count(),
    prisma.prayerRequest.count({ where: { status: "flagged" } }),
    prisma.userLike.count(),
    prisma.userSave.count(),
    prisma.readingPlan.count(),
  ]);

  return NextResponse.json({
    users: {
      total: totalUsers,
      banned: bannedUsers,
      new24h: newUsers24h,
      new7d: newUsers7d,
    },
    posts: { total: totalPosts, new24h: newPosts24h },
    comments: {
      total: totalComments,
      flagged: flaggedComments,
      removed: removedComments,
    },
    moderation: {
      pendingReports,
      flaggedPrayers,
    },
    engagement: {
      likes: totalLikes,
      saves: totalSaves,
      readingPlans: activeReadingPlans,
    },
    generatedAt: now.toISOString(),
  });
}
