import { NextResponse } from "next/server";
import { auth } from "../auth";

export type PremiumGuardResult =
  | { ok: true; userId: string }
  | { ok: false; response: NextResponse };

// Gate any route to signed-in users.
//
// LAUNCH NOTE: Taste Manna is free during beta — there is no paywall.
// This guard now only checks that the user is signed in. The premium /
// subscription logic is intentionally left dormant (not deleted) so it can
// be switched back on later by restoring the isPremium/role check.
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

  // Free during beta: every signed-in user gets full access.
  return { ok: true, userId: session.user.id };
}
