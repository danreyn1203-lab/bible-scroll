import { NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { prisma } from "../../../../lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

    const ads = await prisma.sponsoredPost.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        body: true,
        status: true,
        amountCents: true,
        durationDays: true,
        startsAt: true,
        endsAt: true,
        impressions: true,
        clicks: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ ads });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch ads" }, { status: 500 });
  }
}
