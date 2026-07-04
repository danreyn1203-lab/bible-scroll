import { NextResponse } from "next/server";
import { AD_PRICING, isStripeConfigured } from "../../../../lib/stripe";

export async function GET() {
  return NextResponse.json({
    tiers: AD_PRICING,
    paymentEnabled: isStripeConfigured(),
  });
}
