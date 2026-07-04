import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET() {
  const entities = await prisma.entity.findMany({
    where: {
      type: { in: ["theme", "person", "book", "doctrine"] },
    },
    select: { id: true, label: true, type: true, summary: true },
    orderBy: { label: "asc" },
  });

  return NextResponse.json(entities);
}
