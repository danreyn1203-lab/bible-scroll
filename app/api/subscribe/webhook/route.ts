import { NextResponse } from "next/server";
import { getStripe } from "../../../../lib/stripe";
import { prisma } from "../../../../lib/prisma";

// Stripe sends events here when subscriptions change.
// Add this endpoint in your Stripe dashboard:
//   https://dashboard.stripe.com/webhooks
// URL: https://tastemanna.com/api/subscribe/webhook
// Events: customer.subscription.created, customer.subscription.updated,
//         customer.subscription.deleted, checkout.session.completed
export async function POST(req: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_SUBSCRIPTION_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const payload = await req.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(payload, sig, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const obj = event.data.object as any;

  if (event.type === "checkout.session.completed" && obj.mode === "subscription") {
    const userId = obj.metadata?.userId;
    const customerId = obj.customer as string;
    const subscriptionId = obj.subscription as string;
    if (userId) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          isPremium: true,
          premiumSince: new Date(),
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
        },
      });
    }
  }

  if (event.type === "customer.subscription.updated") {
    const customerId = obj.customer as string;
    const status = obj.status as string; // "active" | "past_due" | "canceled" | "unpaid"
    const isPremium = status === "active" || status === "trialing";
    const periodEnd = obj.current_period_end
      ? new Date(obj.current_period_end * 1000)
      : null;

    await prisma.user.updateMany({
      where: { stripeCustomerId: customerId },
      data: {
        isPremium,
        premiumUntil: periodEnd,
      },
    });
  }

  if (event.type === "customer.subscription.deleted") {
    const customerId = obj.customer as string;
    await prisma.user.updateMany({
      where: { stripeCustomerId: customerId },
      data: {
        isPremium: false,
        premiumUntil: new Date(),
        stripeSubscriptionId: null,
      },
    });
  }

  return NextResponse.json({ received: true });
}
