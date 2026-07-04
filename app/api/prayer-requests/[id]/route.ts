import { NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { prisma } from "../../../../lib/prisma";

// "Praying for you" — increment pray count
export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { id } = await params;
  const request = await prisma.prayerRequest.findUnique({ where: { id } });
  if (!request || request.status !== "visible") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.prayerRequest.update({
    where: { id },
    data: { prayCount: { increment: 1 } },
  });

  return NextResponse.json({ id: updated.id, prayCount: updated.prayCount });
}

// Delete own prayer request
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { id } = await params;
  const request = await prisma.prayerRequest.findUnique({ where: { id } });
  if (!request || request.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.prayerRequest.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
