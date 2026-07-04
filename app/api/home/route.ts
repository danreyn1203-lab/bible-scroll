import { NextResponse } from "next/server";
import { auth } from "../../../auth";
import { prisma } from "../../../lib/prisma";

// Personalized home dashboard: welcome message, streak, level, challenges, recent achievements.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const [user, xp, achievements, challenges, streak] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, displayName: true, age: true, denomination: true, attendsChurch: true },
    }),
    prisma.userXP.findUnique({
      where: { userId: session.user.id },
      select: { totalXP: true, level: true },
    }),
    prisma.userAchievement.findMany({
      where: { userId: session.user.id },
      orderBy: { unlockedAt: "desc" },
      take: 3,
      include: { achievement: { select: { name: true, icon: true } } },
    }),
    prisma.userChallenge.findMany({
      where: { userId: session.user.id },
      include: { challenge: { select: { name: true, goal: true, description: true } } },
    }),
    // Get streak (simplified: consecutive days since last engagement via PostLike)
    prisma.postLike.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 1,
      select: { createdAt: true },
    }),
  ]);

  // Calculate streak (simplified)
  const lastEngagement = streak[0]?.createdAt || new Date(0);
  const daysSinceEngagement = Math.floor((Date.now() - lastEngagement.getTime()) / (24 * 60 * 60 * 1000));
  const streakDays = daysSinceEngagement > 1 ? 0 : 1; // TODO: implement full streak logic

  const greeting = user?.displayName ? `Welcome back, ${user.displayName}!` : "Welcome back!";
  const streakMessage = streakDays > 0 ? `You're on a ${streakDays}-day streak 🔥` : "Start your streak today!";

  return NextResponse.json({
    greeting,
    streakMessage,
    streakDays,
    level: xp?.level || 1,
    totalXP: xp?.totalXP || 0,
    recentAchievements: achievements.map(a => ({ name: a.achievement.name, icon: a.achievement.icon, unlockedAt: a.unlockedAt })),
    weeklyProgress: challenges.map(c => ({
      name: c.challenge.name,
      goal: c.challenge.goal,
      progress: c.progress,
      completed: c.completed,
    })),
  });
}
