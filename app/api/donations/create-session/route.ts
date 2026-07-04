import { NextResponse } from "next/server";
import { auth } from "../../../../auth";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

    const { amount, message } = await req.json();
    if (!amount || amount < 1) return NextResponse.json({ error: "Invalid amount" }, { status: 400 });

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Support Taste Manna",
              description: message || "Thank you for supporting Bible discovery",
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      customer_email: session.user.email ?? undefined,
      success_url: `${process.env.NEXTAUTH_URL}/donation-success.html`,
      cancel_url: `${process.env.NEXTAUTH_URL}/`,
      metadata: {
        userId: session.user.id,
        message: message || "Support",
      },
    });

    return NextResponse.json({ sessionId: checkoutSession.id, url: checkoutSession.url });
  } catch (err) {
    console.error("Donation error:", err);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}
