import { NextResponse } from "next/server";
import { auth } from "../../../auth";
import { prisma } from "../../../lib/prisma";
import { getStripe, isStripeConfigured } from "../../../lib/stripe";

// Creates a Stripe Checkout session in subscription mode.
// On success, Stripe redirects to /upgrade.html?success=true.
// The webhook (below) activates premium when payment confirms.
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Payments not configured" }, { status: 503 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, isPremium: true, stripeCustomerId: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (user.isPremium) return NextResponse.json({ error: "Already premium" }, { status: 400 });

  const stripe = getStripe()!;
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:8943";

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          recurring: { interval: "month" },
          product_data: {
            name: "Simply Manna Premium",
            description: "Unlimited AI chat, devotionals, study plans & ad-free reading",
            images: [`${baseUrl}/logo.png`],
          },
          unit_amount: 499, // $4.99
        },
        quantity: 1,
      },
    ],
    customer_email: user.stripeCustomerId ? undefined : (user.email ?? undefined),
    customer: user.stripeCustomerId ?? undefined,
    subscription_data: {
      metadata: { userId: user.id },
    },
    success_url: `${baseUrl}/upgrade.html?success=true`,
    cancel_url: `${baseUrl}/upgrade.html?canceled=true`,
    metadata: { userId: user.id },
  });

  return NextResponse.json({ url: checkoutSession.url });
}

// Returns current subscription status for the logged-in user
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ isPremium: false });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isPremium: true, premiumSince: true, premiumUntil: true },
  });
  return NextResponse.json(user ?? { isPremium: false });
}
