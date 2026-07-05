import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET() {
  const baseUrl = process.env.NEXTAUTH_URL || "https://simplymanna.com";

  // Fetch dynamic content
  const [content, users, groups] = await Promise.all([
    prisma.content.findMany({ select: { id: true, category: true } }),
    prisma.user.findMany({ where: { role: { not: "user" } }, select: { id: true } }),
    prisma.group.findMany({ select: { id: true, createdAt: true } }),
  ]);

  const urls = [
    { loc: `${baseUrl}/`, priority: "1.0", changefreq: "daily" },
    { loc: `${baseUrl}/index.html`, priority: "1.0", changefreq: "daily" },
    { loc: `${baseUrl}/community.html`, priority: "0.9", changefreq: "hourly" },
    { loc: `${baseUrl}/home.html`, priority: "0.85", changefreq: "daily" },
    { loc: `${baseUrl}/leaderboard.html`, priority: "0.8", changefreq: "daily" },
    { loc: `${baseUrl}/admin.html`, priority: "0.5", changefreq: "weekly" },
    ...content.map(c => ({
      loc: `${baseUrl}/#content-${c.id}`,
      priority: "0.7",
      changefreq: "monthly",
    })),
    ...groups.map(g => ({
      loc: `${baseUrl}/#group-${g.id}`,
      priority: "0.6",
      changefreq: "weekly",
      lastmod: g.createdAt.toISOString().split("T")[0],
    })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls.map(u => `
  <url>
    <loc>${u.loc}</loc>
    <lastmod>${(u as any).lastmod || new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join("")}
</urlset>`;

  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}
