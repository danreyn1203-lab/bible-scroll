import { NextResponse } from "next/server";
import { auth } from "../../../auth";
import { prisma } from "../../../lib/prisma";

// LAUNCH NOTE: Premium subscriptions are dormant during beta — Simply Manna
// is free for everyone. See lib/premiumGuard.ts for the same launch note.
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }
  return NextResponse.json(
    { error: "Premium isn't for sale yet — everything is free during beta.", code: "premium_coming_soon" },
    { status: 503 }
  );
}

// Returns current subscription status for the logged-in user
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ isPremium: false });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isPremium: true, premiumSince: true, premiumUntil: true },
  });
  return NextResponse.json(user ?? { isPremium: false });
}
