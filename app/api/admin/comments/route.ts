import { NextResponse } from "next/server";
import { requireStaff } from "../../../../lib/adminGuard";
import { prisma } from "../../../../lib/prisma";

// List comments by status for moderation triage.
// Default: show flagged + recent visible for quick review.
export async function GET(req: Request) {
  const guard = await requireStaff();
  if (!guard.ok) return guard.response;

  const url = new URL(req.url);
  const status = url.searchParams.get("status"); // "visible" | "flagged" | "removed" | null=all
  const limit = Math.min(Number(url.searchParams.get("limit") || 50), 200);

  const comments = await prisma.comment.findMany({
    where: status ? { status: status as "visible" | "flagged" | "removed" } : undefined,
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, email: true, displayName: true, bannedAt: true } },
      content: { select: { id: true, ref: true } },
    },
  });

  return NextResponse.json({ comments });
}
