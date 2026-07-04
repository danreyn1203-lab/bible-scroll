import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET(req: Request) {
  try {
    const now = new Date();

    // Get active ads that haven't ended yet
    const activeAds = await prisma.sponsoredPost.findMany({
      where: {
        status: "active",
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
      select: {
        id: true,
        title: true,
        body: true,
        mediaUrl: true,
        linkUrl: true,
        impressions: true,
        clicks: true,
      },
      orderBy: { startsAt: "desc" },
      take: 10,
    });

    return NextResponse.json({ ads: activeAds });
  } catch (err) {
    console.error("Active ads error:", err);
    return NextResponse.json({ ads: [] });
  }
}
