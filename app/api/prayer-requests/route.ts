import { NextResponse } from "next/server";
import { auth } from "../../../auth";
import { prisma } from "../../../lib/prisma";
import { checkText } from "../../../lib/moderation";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const groupId = new URL(req.url).searchParams.get("groupId");

  let where: Record<string, unknown> = { status: "visible" };
  if (groupId) {
    where.groupId = groupId;
  } else {
    where.OR = [
      { isPrivate: false },
      { userId: session.user.id },
    ];
  }

  const requests = await prisma.prayerRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { user: { select: { id: true, displayName: true } } },
  });

  return NextResponse.json(
    requests.map(r => ({
      id: r.id,
      text: r.text,
      isPrivate: r.isPrivate,
      prayCount: r.prayCount,
      createdAt: r.createdAt,
      author: { id: r.user.id, displayName: r.user.displayName },
      groupId: r.groupId,
    }))
  );
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { text, groupId, isPrivate = false } = await req.json();
  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const moderation = await checkText(text);
  if (!moderation.allowed) {
    return NextResponse.json(
      { error: "Prayer request didn't pass moderation.", reason: moderation.reason },
      { status: 422 }
    );
  }

  if (groupId) {
    const membership = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId: session.user.id, groupId } },
    });
    if (!membership) return NextResponse.json({ error: "Not a member of this group" }, { status: 403 });
  }

  const request = await prisma.prayerRequest.create({
    data: {
      userId: session.user.id,
      groupId: groupId || null,
      text: text.trim(),
      isPrivate,
      status: moderation.status,
    },
  });

  return NextResponse.json(request, { status: 201 });
}
