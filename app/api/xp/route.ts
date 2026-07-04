import { NextResponse } from "next/server";
import { auth } from "../../../auth";
import { prisma } from "../../../lib/prisma";

// Get user's XP + level.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  let xp = await prisma.userXP.findUnique({ where: { userId: session.user.id } });
  if (!xp) {
    xp = await prisma.userXP.create({ data: { userId: session.user.id, totalXP: 0, level: 1 } });
  }

  return NextResponse.json({ totalXP: xp.totalXP, level: xp.level, nextLevelXP: xp.level * 500 });
}

// Award XP (internal — called by other endpoints).
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { amount, reason } = await req.json();
  if (!amount || amount < 0) return NextResponse.json({ error: "Invalid XP" }, { status: 400 });

  let xp = await prisma.userXP.findUnique({ where: { userId: session.user.id } });
  if (!xp) {
    xp = await prisma.userXP.create({ data: { userId: session.user.id, totalXP: 0, level: 1 } });
  }

  const newTotal = xp.totalXP + amount;
  const newLevel = Math.floor(newTotal / 500) + 1;

  await prisma.userXP.update({
    where: { userId: session.user.id },
    data: { totalXP: newTotal, level: newLevel },
  });

  return NextResponse.json({ totalXP: newTotal, level: newLevel, xpAdded: amount, reason });
}
