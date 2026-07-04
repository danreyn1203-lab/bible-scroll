import { NextResponse } from "next/server";
import { auth } from "../../../auth";
import { prisma } from "../../../lib/prisma";

const VALID_REASONS = ["inappropriate", "misleading", "spam", "off-topic", "other"];

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { contentId, reason, details } = await req.json();
  if (!contentId || typeof contentId !== "string") {
    return NextResponse.json({ error: "contentId required" }, { status: 400 });
  }
  if (!reason || !VALID_REASONS.includes(reason)) {
    return NextResponse.json({ error: `reason must be one of ${VALID_REASONS.join(", ")}` }, { status: 400 });
  }
  if (details && (typeof details !== "string" || details.length > 500)) {
    return NextResponse.json({ error: "details too long (max 500 chars)" }, { status: 400 });
  }

  await prisma.contentReport.create({
    data: { userId: session.user.id, contentId, reason, details: details || null },
  });
  return NextResponse.json({ ok: true });
}
