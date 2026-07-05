import { NextResponse } from "next/server";

// LAUNCH NOTE: Stripe webhooks are dormant during beta — payments aren't
// wired up yet. Re-enable by restoring the Stripe signature verification
// and activation logic here when ad checkout comes back online.
export async function POST() {
  return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
}
