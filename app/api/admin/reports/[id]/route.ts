import { NextResponse } from "next/server";
import { requireStaff } from "../../../../../lib/adminGuard";
import { prisma } from "../../../../../lib/prisma";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireStaff();
  if (!guard.ok) return guard.response;
  const { id } = await params;
  try {
    await prisma.contentReport.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }
}
