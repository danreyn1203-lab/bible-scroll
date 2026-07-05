import { NextResponse } from "next/server";

// LAUNCH NOTE: Ad checkout is dormant during beta — no payment system is
// wired up yet. See app/api/ads/route.ts for draft creation without payment.
export async function POST() {
  return NextResponse.json(
    { error: "Ad checkout isn't open yet — coming soon.", code: "ads_checkout_coming_soon" },
    { status: 503 }
  );
}
