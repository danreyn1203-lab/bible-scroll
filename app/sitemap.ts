import { MetadataRoute } from "next";
import { prisma } from "../lib/prisma";

// Generate at request time, not build time — this queries the database, which
// isn't reachable during Cloudflare's build step.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.APP_URL || "http://localhost:8943";

  // Main pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];

  // Dynamic content pages (entities)
  const entities = await prisma.entity.findMany({ select: { id: true } });
  const entityPages: MetadataRoute.Sitemap = entities.map(e => ({
    url: `${baseUrl}/entity/${e.id}`,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // Content pages (Bible verses, studies, etc.)
  const content = await prisma.content.findMany({ take: 1000, select: { id: true } });
  const contentPages: MetadataRoute.Sitemap = content.map(c => ({
    url: `${baseUrl}/verse/${c.id}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...entityPages, ...contentPages];
}
