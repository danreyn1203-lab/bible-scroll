// Dynamic schema.org JSON-LD generation
// Used by Open Graph scrapers and search engines

import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { generateArticleSchema, generateOrganizationSchema } from "../../../../../lib/seo";

export async function GET(_req: Request, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const baseUrl = process.env.APP_URL || "http://localhost:8943";

  if (type === "organization") {
    return NextResponse.json(generateOrganizationSchema(baseUrl), {
      headers: { "Content-Type": "application/ld+json" },
    });
  }

  if (type.startsWith("content-")) {
    const contentId = type.replace("content-", "");
    const content = await prisma.content.findUnique({
      where: { id: contentId },
      include: { entityLinks: { include: { entity: true } } },
    });
    if (!content) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const schema = generateArticleSchema({
      title: content.ref,
      description: content.text.slice(0, 160),
      url: `${baseUrl}/verse/${content.id}`,
      ogImage: `${baseUrl}/api/og?type=verse&id=${content.id}`,
      keywords: content.entityLinks.map(l => l.entity.label),
      author: { name: "Simply Manna", url: baseUrl },
      publishedAt: new Date(),
      ogType: "article",
    });

    return NextResponse.json(schema, { headers: { "Content-Type": "application/ld+json" } });
  }

  if (type.startsWith("entity-")) {
    const entityId = type.replace("entity-", "");
    const entity = await prisma.entity.findUnique({ where: { id: entityId } });
    if (!entity) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const schema = generateArticleSchema({
      title: entity.label,
      description: entity.summary,
      url: `${baseUrl}/entity/${entity.id}`,
      ogImage: `${baseUrl}/api/og?type=entity&id=${entity.id}`,
      keywords: [entity.label, entity.type],
      author: { name: "Simply Manna", url: baseUrl },
      publishedAt: new Date(),
      ogType: "article",
    });

    return NextResponse.json(schema, { headers: { "Content-Type": "application/ld+json" } });
  }

  return NextResponse.json({ error: "Unknown type" }, { status: 400 });
}
