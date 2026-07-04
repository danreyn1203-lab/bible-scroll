import { NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { prisma } from "../../../../lib/prisma";
import { AD_PRICING, getStripe, isStripeConfigured } from "../../../../lib/stripe";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

    if (!isStripeConfigured()) {
      return NextResponse.json({ error: "Payments aren't configured on this server yet" }, { status: 503 });
    }

    const { tierId, title, body, mediaUrl, linkUrl } = await req.json();

    const tier = AD_PRICING.find(p => p.id === tierId);
    if (!tier || !title || !body) {
      return NextResponse.json({ error: "Invalid ad data" }, { status: 400 });
    }

    // Create SponsoredPost record with pending_payment status
    const ad = await prisma.sponsoredPost.create({
      data: {
        userId: session.user.id,
        title,
        body,
        mediaUrl: mediaUrl || null,
        linkUrl: linkUrl || null,
        status: "pending_payment",
        amountCents: tier.amountCents,
        durationDays: tier.durationDays,
      },
    });

    // Create Stripe checkout session
    const stripe = getStripe()!;
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Sponsored post — ${tier.label}`,
              description: `Promote your message for ${tier.durationDays} days`,
              images: mediaUrl ? [mediaUrl] : undefined,
            },
            unit_amount: tier.amountCents,
          },
          quantity: 1,
        },
      ],
      customer_email: session.user.email ?? undefined,
      success_url: `${process.env.NEXTAUTH_URL}/ads.html?success=true&adId=${ad.id}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/ads.html?canceled=true`,
      metadata: {
        adId: ad.id,
        userId: session.user.id,
        tierId,
      },
    });

    // Update ad with Stripe session ID
    await prisma.sponsoredPost.update({
      where: { id: ad.id },
      data: { stripeSessionId: checkoutSession.id },
    });

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
      adId: ad.id,
    });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json({ error: "Failed to create checkout" }, { status: 500 });
  }
}
