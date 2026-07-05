import { NextResponse } from "next/server";

// LAUNCH NOTE: Stripe subscription webhooks are dormant during beta —
// premium isn't for sale yet. Re-enable by restoring the Stripe signature
// verification and premium-activation logic here when subscriptions launch.
export async function POST() {
  return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
}
