import { getCloudflareContext } from "@opennextjs/cloudflare";

// Streams a post photo/video/thumbnail back out of the R2 bucket.
// mediaUrl on a Post is stored as "/api/media/<key>", so this route is
// the effective public URL for all uploaded post media.
export async function GET(_req: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const { key } = await params;
  const objectKey = key.join("/");

  const { env } = await getCloudflareContext({ async: true });
  const object = await env.MEDIA_BUCKET.get(objectKey);

  if (!object) {
    return new Response("Not found", { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");

  return new Response(object.body, { headers });
}
