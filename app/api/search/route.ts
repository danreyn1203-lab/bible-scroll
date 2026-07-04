import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

// Cross-entity search: users, posts (captions), content (verses/refs), entities.
// Public — no sensitive fields exposed.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ users: [], posts: [], content: [], entities: [] });
  }

  const limit = 8;
  const [users, posts, content, entities] = await Promise.all([
    prisma.user.findMany({
      where: {
        OR: [
          { displayName: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
        bannedAt: null,
      },
      select: { id: true, displayName: true, avatarUrl: true, bio: true },
      take: limit,
    }),
    prisma.post.findMany({
      where: { caption: { contains: q, mode: "insensitive" } },
      include: { user: { select: { id: true, displayName: true, avatarUrl: true } } },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    prisma.content.findMany({
      where: {
        OR: [
          { text: { contains: q, mode: "insensitive" } },
          { ref: { contains: q, mode: "insensitive" } },
        ],
      },
      take: limit,
    }),
    prisma.entity.findMany({
      where: {
        OR: [
          { label: { contains: q, mode: "insensitive" } },
          { summary: { contains: q, mode: "insensitive" } },
        ],
      },
      take: limit,
    }),
  ]);

  return NextResponse.json({
    users: users.map(u => ({ id: u.id, displayName: u.displayName, avatarUrl: u.avatarUrl, bio: u.bio })),
    posts: posts.map(p => ({
      id: p.id,
      caption: p.caption?.slice(0, 200),
      mediaUrl: p.mediaUrl,
      mediaType: p.mediaType,
      thumbnailUrl: p.thumbnailUrl,
      author: p.user,
    })),
    content: content.map(c => ({ id: c.id, ref: c.ref, text: c.text.slice(0, 240), category: c.category })),
    entities: entities.map(e => ({ id: e.id, type: e.type, label: e.label, summary: e.summary.slice(0, 240) })),
  });
}
