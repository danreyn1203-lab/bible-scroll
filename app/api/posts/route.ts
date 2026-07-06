import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { randomUUID } from "crypto";
import { auth } from "../../../auth";
import { prisma } from "../../../lib/prisma";
import { checkText } from "../../../lib/moderation";

const MAX_BYTES = 50 * 1024 * 1024; // 50 MB

export async function GET() {
  const session = await auth();
  const viewerId = session?.user?.id || null;

  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      user: { select: { id: true, displayName: true, avatarUrl: true } },
      _count: { select: { likes: true, comments: { where: { status: "visible" } } } },
    },
  });

  const likedSet = new Set<string>();
  if (viewerId) {
    const likes = await prisma.postLike.findMany({
      where: { userId: viewerId, postId: { in: posts.map(p => p.id) } },
      select: { postId: true },
    });
    likes.forEach(l => likedSet.add(l.postId));
  }

  return NextResponse.json(
    posts.map(p => ({
      id: p.id,
      caption: p.caption,
      mediaUrl: p.mediaUrl,
      mediaType: p.mediaType,
      thumbnailUrl: p.thumbnailUrl,
      createdAt: p.createdAt,
      author: { id: p.user.id, displayName: p.user.displayName, avatarUrl: p.user.avatarUrl },
      isOwn: viewerId === p.user.id,
      likeCount: p._count.likes,
      commentCount: p._count.comments,
      liked: likedSet.has(p.id),
    }))
  );
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("media") as File | null;
  const caption = (form.get("caption")?.toString() || "").trim();
  const thumbnailDataUrl = form.get("thumbnail")?.toString() || null;

  if (!file && !caption) {
    return NextResponse.json({ error: "Add a photo, video, or caption." }, { status: 400 });
  }

  if (caption) {
    if (caption.length > 1000) return NextResponse.json({ error: "Caption too long (max 1000)" }, { status: 400 });
    const mod = await checkText(caption);
    if (!mod.allowed) return NextResponse.json({ error: "Caption didn't pass moderation", reason: mod.reason }, { status: 422 });
  }

  const { env } = await getCloudflareContext({ async: true });

  let mediaUrl: string | null = null;
  let mediaType: string | null = null;

  if (file && file.size > 0) {
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File too large (max 50 MB)" }, { status: 413 });
    }
    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");
    if (!isVideo && !isImage) {
      return NextResponse.json({ error: "Only images and videos are allowed" }, { status: 400 });
    }
    mediaType = isVideo ? "video" : "photo";
    const ext = (file.name.split(".").pop() || (isVideo ? "mp4" : "jpg")).toLowerCase().replace(/[^a-z0-9]/g, "");
    const key = `posts/${randomUUID()}.${ext.slice(0, 5) || (isVideo ? "mp4" : "jpg")}`;
    const buf = await file.arrayBuffer();
    await env.MEDIA_BUCKET.put(key, buf, { httpMetadata: { contentType: file.type } });
    mediaUrl = `/api/media/${key}`;
  }

  // Save video thumbnail if the client extracted one (data:image/jpeg;base64,...)
  let thumbnailUrl: string | null = null;
  if (thumbnailDataUrl && thumbnailDataUrl.startsWith("data:image/") && mediaType === "video") {
    const match = thumbnailDataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
    if (match) {
      const thumbExt = match[1] === "jpeg" ? "jpg" : match[1].slice(0, 4);
      const thumbBuf = Buffer.from(match[2], "base64");
      if (thumbBuf.length < 2 * 1024 * 1024) {
        const thumbKey = `posts/${randomUUID()}-thumb.${thumbExt}`;
        await env.MEDIA_BUCKET.put(thumbKey, thumbBuf, { httpMetadata: { contentType: `image/${match[1]}` } });
        thumbnailUrl = `/api/media/${thumbKey}`;
      }
    }
  }

  const post = await prisma.post.create({
    data: { userId: session.user.id, caption: caption || null, mediaUrl, mediaType, thumbnailUrl },
  });

  return NextResponse.json({
    id: post.id, caption: post.caption, mediaUrl: post.mediaUrl, mediaType: post.mediaType, thumbnailUrl: post.thumbnailUrl, createdAt: post.createdAt,
  }, { status: 201 });
}
