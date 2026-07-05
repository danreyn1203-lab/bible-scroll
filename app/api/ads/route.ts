import { NextResponse } from "next/server";
import { auth } from "../../../auth";
import { prisma } from "../../../lib/prisma";
import { checkText } from "../../../lib/moderation";
import { AD_PRICING } from "../../../lib/adPricing";

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

// LAUNCH NOTE: Ad checkout is dormant during beta — no payment system is
// wired up. Drafts are still created so the flow can be re-enabled later.
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

  return NextResponse.json({
    ad,
    checkoutUrl: null,
    hint: "Sponsored ads aren't open for payment yet — coming soon.",
  });
}
