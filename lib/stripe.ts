// Stripe singleton — initialized lazily so the app works without keys.
// Set STRIPE_SECRET_KEY in .env to enable payments.

import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe | null {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  _stripe = new Stripe(key, { apiVersion: "2026-06-24.dahlia" });
  return _stripe;
}

export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

// Pricing tiers for sponsored posts. Edit to taste; values are in cents.
export const AD_PRICING = [
  { id: "boost-3", label: "3-day boost", durationDays: 3, amountCents: 499 },
  { id: "boost-7", label: "7-day boost", durationDays: 7, amountCents: 999 },
  { id: "boost-30", label: "30-day boost", durationDays: 30, amountCents: 2999 },
] as const;
