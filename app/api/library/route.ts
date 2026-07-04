import { NextResponse } from "next/server";
import { auth } from "../../../auth";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const uid = session.user.id;

  const [bibleLikes, saves, comments, postLikes, postComments] = await Promise.all([
    // Bible content likes
    prisma.userLike.findMany({
      where: { userId: uid },
      orderBy: { createdAt: "desc" },
      include: { content: true },
    }),
    // Bible content saves
    prisma.userSave.findMany({
      where: { userId: uid },
      orderBy: { createdAt: "desc" },
      include: { content: true },
    }),
    // Bible content comments
    prisma.comment.findMany({
      where: { userId: uid, status: "visible" },
      orderBy: { createdAt: "desc" },
      include: { content: true },
    }),
    // Community post likes
    prisma.postLike.findMany({
      where: { userId: uid },
      orderBy: { createdAt: "desc" },
      include: {
        post: {
          select: {
            id: true,
            caption: true,
            mediaUrl: true,
            mediaType: true,
            thumbnailUrl: true,
            createdAt: true,
            user: { select: { displayName: true, avatarUrl: true } },
          },
        },
      },
    }),
    // Community post comments
    prisma.postComment.findMany({
      where: { userId: uid },
      orderBy: { createdAt: "desc" },
      include: {
        post: {
          select: {
            id: true,
            caption: true,
            mediaUrl: true,
            mediaType: true,
            thumbnailUrl: true,
            createdAt: true,
            user: { select: { displayName: true, avatarUrl: true } },
          },
        },
      },
    }),
  ]);

  return NextResponse.json({
    liked: [
      ...bibleLikes.map(l => ({ kind: "bible", ...l.content, likedAt: l.createdAt })),
      ...postLikes.map(l => ({ kind: "post", ...l.post, likedAt: l.createdAt })),
    ].sort((a, b) => new Date(b.likedAt).getTime() - new Date(a.likedAt).getTime()),

    saved: saves.map(s => ({ kind: "bible", ...s.content, savedAt: s.createdAt })),

    commented: [
      ...comments.map(c => ({
        kind: "bible",
        ...c.content,
        commentId: c.id,
        commentText: c.text,
        commentedAt: c.createdAt,
      })),
      ...postComments.map(c => ({
        kind: "post",
        ...c.post,
        commentId: c.id,
        commentText: c.text,
        commentedAt: c.createdAt,
      })),
    ].sort((a, b) => new Date(b.commentedAt).getTime() - new Date(a.commentedAt).getTime()),
  });
}
