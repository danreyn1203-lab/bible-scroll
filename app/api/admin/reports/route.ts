import { NextResponse } from "next/server";
import { requireStaff } from "../../../../lib/adminGuard";
import { prisma } from "../../../../lib/prisma";

// List content reports for moderator review.
// Joins reporter + reported-content snippets for triage context.
export async function GET(req: Request) {
  const guard = await requireStaff();
  if (!guard.ok) return guard.response;

  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") || 50), 200);

  const reports = await prisma.contentReport.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
  });

  const userIds = [...new Set(reports.map(r => r.userId))];
  const contentIds = [...new Set(reports.map(r => r.contentId))];

  // contentId can be a Bible content ID ("v.john316") or "post:<uuid>"
  const postIds = contentIds.filter(id => id.startsWith("post:")).map(id => id.replace("post:", ""));
  const bibleIds = contentIds.filter(id => !id.startsWith("post:"));

  const [users, bibleContents, posts] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true, displayName: true },
    }),
    bibleIds.length ? prisma.content.findMany({
      where: { id: { in: bibleIds } },
      select: { id: true, ref: true, text: true, category: true },
    }) : [],
    postIds.length ? prisma.post.findMany({
      where: { id: { in: postIds } },
      select: { id: true, caption: true, mediaType: true, mediaUrl: true, user: { select: { displayName: true, email: true } } },
    }) : [],
  ]);

  const userMap = new Map(users.map(u => [u.id, u]));
  const bibleMap = new Map((bibleContents as any[]).map((c: any) => [c.id, c]));
  const postMap = new Map((posts as any[]).map((p: any) => [`post:${p.id}`, p]));

  return NextResponse.json({
    reports: reports.map(r => {
      const bibleContent = bibleMap.get(r.contentId);
      const post = postMap.get(r.contentId);
      const content = bibleContent
        ? { type: "bible", ref: bibleContent.ref, text: bibleContent.text?.slice(0, 120) }
        : post
        ? { type: "post", ref: `Post by ${post.user?.displayName || post.user?.email || "Unknown"}`, text: post.caption || `[${post.mediaType} post]` }
        : { type: "unknown", ref: r.contentId, text: null };
      return {
        id: r.id,
        reason: r.reason,
        details: r.details,
        createdAt: r.createdAt,
        reporter: userMap.get(r.userId) || null,
        content,
      };
    }),
  });
}
