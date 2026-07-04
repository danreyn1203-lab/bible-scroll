import { NextResponse } from "next/server";
import { getStripe } from "../../../../lib/stripe";
import { prisma } from "../../../../lib/prisma";

// Stripe webhook handler. Configure your endpoint in the Stripe dashboard:
//   https://dashboard.stripe.com/webhooks
// then set STRIPE_WEBHOOK_SECRET in .env. On checkout.session.completed,
// we activate the sponsored post so it shows up in /api/ads.
export async function POST(req: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
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

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as { metadata?: { adId?: string } };
    const adId = session.metadata?.adId;
    if (adId) {
      const ad = await prisma.sponsoredPost.findUnique({ where: { id: adId } });
      if (ad) {
        const startsAt = new Date();
        const endsAt = new Date(startsAt.getTime() + ad.durationDays * 24 * 60 * 60 * 1000);
        await prisma.sponsoredPost.update({
          where: { id: adId },
          data: { status: "active", startsAt, endsAt },
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}
