import { NextResponse } from "next/server";
import { auth } from "../../../auth";
import { prisma } from "../../../lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const contentId = new URL(req.url).searchParams.get("contentId");
  const annotations = await prisma.annotation.findMany({
    where: { userId: session.user.id, ...(contentId ? { contentId } : {}) },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(annotations);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { contentId, note, highlightText } = await req.json();
  if (!contentId || typeof contentId !== "string") {
    return NextResponse.json({ error: "contentId is required" }, { status: 400 });
  }
  if (!note && !highlightText) {
    return NextResponse.json({ error: "Provide a note and/or highlightText" }, { status: 400 });
  }

  const content = await prisma.content.findUnique({ where: { id: contentId } });
  if (!content) return NextResponse.json({ error: "Unknown content" }, { status: 404 });

  const annotation = await prisma.annotation.create({
    data: { userId: session.user.id, contentId, note: note || null, highlightText: highlightText || null },
  });
  return NextResponse.json(annotation, { status: 201 });
}
