import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/adminGuard";
import { prisma } from "../../../../lib/prisma";

export async function GET(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const url = new URL(req.url);
  const status = url.searchParams.get("status") || "pending";

  const apps = await prisma.moderatorApplication.findMany({
    where: { status },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ applications: apps });
}
