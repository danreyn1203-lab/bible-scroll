// Pricing tiers for sponsored posts. Edit to taste; values are in cents.
// Split out from lib/stripe.ts so routes that only need the price list don't
// have to bundle the (large) Stripe SDK.
export const AD_PRICING = [
  { id: "boost-3", label: "3-day boost", durationDays: 3, amountCents: 499 },
  { id: "boost-7", label: "7-day boost", durationDays: 7, amountCents: 999 },
  { id: "boost-30", label: "30-day boost", durationDays: 30, amountCents: 2999 },
] as const;
