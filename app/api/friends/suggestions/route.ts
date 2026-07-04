import { NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { prisma } from "../../../../lib/prisma";

// "People you may know" suggestions.
// Sources (in priority order):
//   1. Same city
//   2. Same denomination
//   3. Active in same groups
//   4. Recent active users (fallback)
// Excludes: yourself, banned users, existing friends, pending requests.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      city: true,
      denomination: true,
      sentRequests: { select: { toId: true } },
      recvRequests: { select: { fromId: true } },
      groupMembers: { select: { groupId: true } },
    },
  });
  if (!me) return NextResponse.json({ suggestions: [] });

  const excludeIds = new Set<string>([me.id]);
  me.sentRequests.forEach(r => excludeIds.add(r.toId));
  me.recvRequests.forEach(r => excludeIds.add(r.fromId));

  const baseWhere = {
    id: { notIn: [...excludeIds] },
    bannedAt: null,
  };

  const seen = new Set<string>();
  const collected: Array<{ id: string; displayName: string | null; avatarUrl: string | null; bio: string | null; reason: string }> = [];

  const take = (rows: Array<{ id: string; displayName: string | null; avatarUrl: string | null; bio: string | null }>, reason: string) => {
    for (const u of rows) {
      if (seen.has(u.id)) continue;
      seen.add(u.id);
      collected.push({ ...u, reason });
      if (collected.length >= 12) return true;
    }
    return false;
  };

  const select = { id: true, displayName: true, avatarUrl: true, bio: true };

  if (me.city) {
    const rows = await prisma.user.findMany({
      where: { ...baseWhere, city: { equals: me.city, mode: "insensitive" } },
      select, take: 12,
    });
    if (take(rows, `From ${me.city}`)) return NextResponse.json({ suggestions: collected });
  }

  if (me.denomination) {
    const rows = await prisma.user.findMany({
      where: { ...baseWhere, denomination: me.denomination, id: { notIn: [...excludeIds, ...seen] } },
      select, take: 12,
    });
    if (take(rows, `Also ${me.denomination}`)) return NextResponse.json({ suggestions: collected });
  }

  if (me.groupMembers.length) {
    const groupIds = me.groupMembers.map(g => g.groupId);
    const members = await prisma.groupMember.findMany({
      where: { groupId: { in: groupIds }, userId: { notIn: [...excludeIds, ...seen] } },
      include: { user: { select } },
      take: 24,
    });
    if (take(members.map(m => m.user), "In your groups")) return NextResponse.json({ suggestions: collected });
  }

  // Fallback: newest users
  const fallback = await prisma.user.findMany({
    where: { ...baseWhere, id: { notIn: [...excludeIds, ...seen] } },
    select, take: 12, orderBy: { createdAt: "desc" },
  });
  take(fallback, "New to Taste Manna");

  return NextResponse.json({ suggestions: collected });
}
