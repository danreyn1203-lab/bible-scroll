import { NextResponse } from "next/server";
import { requireStaff } from "../../../../../lib/adminGuard";
import { prisma } from "../../../../../lib/prisma";

// Moderator action: change comment status (visible/flagged/removed).
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireStaff();
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const { status, reason } = await req.json();

  if (!["visible", "flagged", "removed"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const updated = await prisma.comment.update({
    where: { id },
    data: { status, reason: reason || null },
  });

  return NextResponse.json({ comment: updated });
}
