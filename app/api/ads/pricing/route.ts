import { NextResponse } from "next/server";
import { AD_PRICING } from "../../../../lib/adPricing";

export async function GET() {
  return NextResponse.json({
    tiers: AD_PRICING,
    paymentEnabled: false,
  });
}
