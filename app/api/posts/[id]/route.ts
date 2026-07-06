import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { auth } from "../../../../auth";
import { prisma } from "../../../../lib/prisma";

function r2KeyFromMediaUrl(url: string | null): string | null {
  if (!url?.startsWith("/api/media/")) return null;
  return url.slice("/api/media/".length);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { id } = await params;

  const post = await prisma.post.findUnique({ where: { id } });
  if (!post || post.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { env } = await getCloudflareContext({ async: true });
  const mediaKey = r2KeyFromMediaUrl(post.mediaUrl);
  const thumbKey = r2KeyFromMediaUrl(post.thumbnailUrl);
  if (mediaKey) await env.MEDIA_BUCKET.delete(mediaKey).catch(() => {});
  if (thumbKey) await env.MEDIA_BUCKET.delete(thumbKey).catch(() => {});

  await prisma.post.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
