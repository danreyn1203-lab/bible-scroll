import { NextResponse } from "next/server";
import { auth } from "../../../auth";
import { prisma } from "../../../lib/prisma";
import { checkText } from "../../../lib/moderation";
import { AD_PRICING, getStripe, isStripeConfigured } from "../../../lib/stripe";

// List currently active sponsored posts (public read).
export async function GET() {
  const now = new Date();
  const ads = await prisma.sponsoredPost.findMany({
    where: { status: "active", endsAt: { gt: now } },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  return NextResponse.json({ ads });
}

// Create a sponsored post draft + (optionally) a Stripe checkout session.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const body = await req.json();
  const { title, body: adBody, mediaUrl, linkUrl, tier } = body;

  if (!title || !adBody) return NextResponse.json({ error: "title and body required" }, { status: 400 });

  const pricing = AD_PRICING.find(p => p.id === tier);
  if (!pricing) return NextResponse.json({ error: "Invalid tier" }, { status: 400 });

  // Moderate the ad copy before charging
  const titleMod = await checkText(title);
  const bodyMod = await checkText(adBody);
  if (!titleMod.allowed || !bodyMod.allowed) {
    return NextResponse.json(
      { error: "Ad copy didn't pass moderation", reason: titleMod.reason || bodyMod.reason },
      { status: 422 }
    );
  }

  const ad = await prisma.sponsoredPost.create({
    data: {
      userId: session.user.id,
      title: title.slice(0, 120),
      body: adBody.slice(0, 600),
      mediaUrl: mediaUrl || null,
      linkUrl: linkUrl || null,
      status: "draft",
      amountCents: pricing.amountCents,
      durationDays: pricing.durationDays,
    },
  });

  // If Stripe is configured, kick off a checkout session.
  // Otherwise return the draft with a hint to the operator.
  if (!isStripeConfigured()) {
    return NextResponse.json({
      ad,
      checkoutUrl: null,
      hint: "Stripe not configured. Set STRIPE_SECRET_KEY to enable payments.",
    });
  }

  const stripe = getStripe()!;
  const appUrl = process.env.APP_URL || "http://localhost:8943";
  const checkout = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [{
      price_data: {
        currency: "usd",
        product_data: { name: `Sponsored post — ${pricing.label}` },
        unit_amount: pricing.amountCents,
      },
      quantity: 1,
    }],
    success_url: `${appUrl}/?ad_paid=${ad.id}`,
    cancel_url: `${appUrl}/?ad_canceled=${ad.id}`,
    metadata: { adId: ad.id, userId: session.user.id },
  });

  await prisma.sponsoredPost.update({
    where: { id: ad.id },
    data: { status: "pending_payment", stripeSessionId: checkout.id },
  });

  return NextResponse.json({ ad, checkoutUrl: checkout.url });
}
