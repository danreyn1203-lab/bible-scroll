import { NextResponse } from "next/server";
import { requireStaff, requireAdmin } from "../../../../../lib/adminGuard";
import { prisma } from "../../../../../lib/prisma";

// Ban/unban or change role for a user.
// Banning: any staff can ban; role changes require admin (prevents privilege escalation).
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { action, reason, role } = body;

  if (action === "ban" || action === "unban") {
    const guard = await requireStaff();
    if (!guard.ok) return guard.response;

    if (guard.user.id === id) {
      return NextResponse.json({ error: "Cannot ban yourself" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id },
      data:
        action === "ban"
          ? { bannedAt: new Date(), banReason: reason || "No reason provided" }
          : { bannedAt: null, banReason: null },
      select: { id: true, email: true, bannedAt: true, banReason: true },
    });
    return NextResponse.json({ user: updated });
  }

  if (action === "setRole") {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.response;
    if (!["user", "moderator", "admin"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    if (guard.user.id === id && role !== "admin") {
      return NextResponse.json({ error: "Cannot demote yourself" }, { status: 400 });
    }
    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, email: true, role: true },
    });
    return NextResponse.json({ user: updated });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
