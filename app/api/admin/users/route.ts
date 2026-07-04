import { NextResponse } from "next/server";
import { requireStaff } from "../../../../lib/adminGuard";
import { prisma } from "../../../../lib/prisma";

// List users for admin dashboard with engagement counts.
export async function GET(req: Request) {
  const guard = await requireStaff();
  if (!guard.ok) return guard.response;

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();
  const filter = url.searchParams.get("filter"); // "banned" | "staff" | null
  const limit = Math.min(Number(url.searchParams.get("limit") || 50), 200);

  const users = await prisma.user.findMany({
    where: {
      AND: [
        q ? { OR: [{ email: { contains: q, mode: "insensitive" } }, { displayName: { contains: q, mode: "insensitive" } }] } : {},
        filter === "banned" ? { bannedAt: { not: null } } : {},
        filter === "staff" ? { role: { in: ["admin", "moderator"] } } : {},
      ],
    },
    take: limit,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      displayName: true,
      avatarUrl: true,
      role: true,
      bannedAt: true,
      banReason: true,
      createdAt: true,
      _count: { select: { posts: true, comments: true, likes: true } },
    },
  });

  return NextResponse.json({ users });
}
