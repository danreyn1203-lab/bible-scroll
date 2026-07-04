import { NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { prisma } from "../../../../lib/prisma";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { id } = await params;
  const annotation = await prisma.annotation.findUnique({ where: { id } });
  if (!annotation || annotation.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await prisma.annotation.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
