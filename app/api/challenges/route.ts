import { NextResponse } from "next/server";
import { auth } from "../../../auth";
import { prisma } from "../../../lib/prisma";

// Get this week's challenges + user's progress.
export async function GET() {
  const session = await auth();
  const userId = session?.user?.id || null;

  // Get Monday of this week
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
  monday.setHours(0, 0, 0, 0);

  const challenges = await prisma.challenge.findMany({
    where: { weekOf: { gte: monday }, active: true },
    orderBy: { createdAt: "asc" },
    take: 7,
  });

  if (!userId) return NextResponse.json({ challenges, userProgress: [] });

  const progress = await prisma.userChallenge.findMany({
    where: { userId, challengeId: { in: challenges.map(c => c.id) } },
  });

  return NextResponse.json({
    challenges,
    userProgress: progress,
  });
}

// Create default weekly challenges (call once).
export async function POST(req: Request) {
  const { seed } = await req.json();
  if (seed !== "true") return NextResponse.json({ error: "Seed only" }, { status: 400 });

  const monday = new Date();
  monday.setDate(new Date().getDate() - new Date().getDay() + (new Date().getDay() === 0 ? -6 : 1));
  monday.setHours(0, 0, 0, 0);

  const challenges = [
    { name: "Read 7 Verses", description: "Read at least 7 verses this week", type: "read", goal: 7, xpReward: 200, weekOf: monday, active: true },
    { name: "Share & Tell", description: "Share 3 verses with friends", type: "share", goal: 3, xpReward: 150, weekOf: monday, active: true },
    { name: "Pray 5 Times", description: "Share 5 prayer requests", type: "pray", goal: 5, xpReward: 175, weekOf: monday, active: true },
    { name: "Comment Crew", description: "Post 5 comments on posts", type: "comment", goal: 5, xpReward: 125, weekOf: monday, active: true },
  ];

  for (const c of challenges) {
    // Check if this week's challenge already exists
    const existing = await prisma.challenge.findFirst({
      where: { name: c.name, weekOf: c.weekOf },
    });
    if (!existing) {
      await prisma.challenge.create({ data: c });
    }
  }

  return NextResponse.json({ created: challenges.length });
}
