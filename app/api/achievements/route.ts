import { NextResponse } from "next/server";
import { auth } from "../../../auth";
import { prisma } from "../../../lib/prisma";

// Get all achievements + user's unlocked ones.
export async function GET() {
  const session = await auth();
  const userId = session?.user?.id || null;

  const all = await prisma.achievement.findMany({ orderBy: { category: "asc" } });
  if (!userId) return NextResponse.json({ achievements: all, unlocked: [] });

  const unlocked = await prisma.userAchievement.findMany({
    where: { userId },
    select: { achievementId: true, unlockedAt: true },
  });
  const unlockedIds = new Set(unlocked.map(u => u.achievementId));

  return NextResponse.json({
    achievements: all.map(a => ({
      ...a,
      criteria: JSON.parse(a.criteria),
      isUnlocked: unlockedIds.has(a.id),
    })),
    unlocked: unlocked.map(u => ({ id: u.achievementId, unlockedAt: u.unlockedAt })),
  });
}

// Seed default achievements (call once during setup).
export async function POST(req: Request) {
  const { seed } = await req.json();
  if (seed !== "true") return NextResponse.json({ error: "Seed only" }, { status: 400 });

  const achievements = [
    { name: "First Like", description: "Like your first verse", icon: "❤️", category: "social", criteria: '{"type":"like","count":1}', xpReward: 25 },
    { name: "Liker", description: "Like 10 verses", icon: "❤️", category: "social", criteria: '{"type":"like","count":10}', xpReward: 100 },
    { name: "Savior", description: "Save 5 verses", icon: "📖", category: "explorer", criteria: '{"type":"save","count":5}', xpReward: 75 },
    { name: "Streak Starter", description: "Reach a 7-day streak", icon: "🔥", category: "streak", criteria: '{"type":"streak","days":7}', xpReward: 200 },
    { name: "On Fire", description: "Reach a 30-day streak", icon: "🔥", category: "streak", criteria: '{"type":"streak","days":30}', xpReward: 500 },
    { name: "Commenter", description: "Post 5 comments", icon: "💬", category: "social", criteria: '{"type":"comment","count":5}', xpReward: 100 },
    { name: "Sharer", description: "Share 3 verses", icon: "↗️", category: "social", criteria: '{"type":"share","count":3}', xpReward: 150 },
    { name: "Friend Maker", description: "Add 5 friends", icon: "👥", category: "social", criteria: '{"type":"friend","count":5}', xpReward: 125 },
    { name: "Prayer Warrior", description: "Share 5 prayer requests", icon: "🙏", category: "learner", criteria: '{"type":"prayer","count":5}', xpReward: 100 },
    { name: "Explorer", description: "Explore 10 topics", icon: "🗺️", category: "explorer", criteria: '{"type":"explore","count":10}', xpReward: 150 },
  ];

  for (const a of achievements) {
    await prisma.achievement.upsert({
      where: { name: a.name },
      update: {},
      create: a,
    });
  }

  return NextResponse.json({ created: achievements.length });
}
