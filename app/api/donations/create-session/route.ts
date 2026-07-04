import { NextResponse } from "next/server";

// LAUNCH NOTE: Donations are not open during beta. This endpoint is dormant
// and returns a clear "coming soon" response. The Stripe-backed implementation
// was intentionally removed for launch and can be restored later.
export async function POST() {
  return NextResponse.json(
    { error: "Donations aren't open yet — coming soon.", code: "donations_coming_soon" },
    { status: 503 }
  );
}
