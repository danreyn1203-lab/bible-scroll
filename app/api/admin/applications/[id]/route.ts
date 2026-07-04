import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../../lib/adminGuard";
import { prisma } from "../../../../../lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const { action, notes } = await req.json();
  if (!["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const app = await prisma.moderatorApplication.findUnique({ where: { id } });
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Approve: promote the applicant's account (if their email matches) to moderator
  if (action === "approve") {
    const matching = await prisma.user.findUnique({ where: { email: app.email } });
    if (matching) {
      await prisma.user.update({ where: { id: matching.id }, data: { role: "moderator" } });
    }
  }

  const updated = await prisma.moderatorApplication.update({
    where: { id },
    data: {
      status: action === "approve" ? "approved" : "rejected",
      reviewedById: guard.user.id,
      reviewNotes: notes || null,
      reviewedAt: new Date(),
    },
  });

  return NextResponse.json({ application: updated });
}
