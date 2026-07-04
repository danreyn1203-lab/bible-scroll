import { NextResponse } from "next/server";
import { auth } from "../auth";
import { prisma } from "./prisma";

export type PremiumGuardResult =
  | { ok: true; userId: string }
  | { ok: false; response: NextResponse };

// Gate any route to premium subscribers only.
// Usage: const guard = await requirePremium(); if (!guard.ok) return guard.response;
export async function requirePremium(): Promise<PremiumGuardResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Sign in to use AI features", code: "unauthenticated" },
        { status: 401 }
      ),
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, isPremium: true, role: true },
  });

  // Admins and moderators always get premium access
  if (!user || (!user.isPremium && user.role === "user")) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Premium membership required", code: "premium_required" },
        { status: 403 }
      ),
    };
  }

  return { ok: true, userId: user.id };
}
