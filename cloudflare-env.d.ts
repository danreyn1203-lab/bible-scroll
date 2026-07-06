// Extends the CloudflareEnv interface (declared by @opennextjs/cloudflare)
// with the bindings this app actually uses, so getCloudflareContext().env
// is properly typed in route handlers.
export {};

declare global {
  interface CloudflareEnv {
    MEDIA_BUCKET: R2Bucket;
  }
}
