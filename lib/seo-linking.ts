// Internal linking strategy for SEO
// Helps content discovery, distributes page authority, and improves rankings

import { prisma } from "./prisma";

// Find topically related content to link within verses/studies
export async function findRelatedContent(contentId: string, limit = 3) {
  const current = await prisma.content.findUnique({
    where: { id: contentId },
    include: { entityLinks: { include: { entity: true } } },
  });
  if (!current) return [];

  const entityIds = current.entityLinks.map(l => l.entityId);
  if (entityIds.length === 0) return [];

  // Find other content linked to the same entities (topically related)
  const related = await prisma.content.findMany({
    where: {
      NOT: { id: contentId },
      entityLinks: { some: { entityId: { in: entityIds } } },
    },
    take: limit,
  });

  return related;
}

// Generate breadcrumb trail for a piece of content
export async function getBreadcrumbs(contentId: string) {
  const content = await prisma.content.findUnique({
    where: { id: contentId },
    include: { entityLinks: { include: { entity: true } } },
  });
  if (!content) return [];

  const crumbs = [{ name: "Home", url: "/" }];
  if (content.entityLinks.length > 0) {
    const primaryEntity = content.entityLinks[0].entity;
    crumbs.push({
      name: primaryEntity.type.charAt(0).toUpperCase() + primaryEntity.type.slice(1),
      url: `/entity/${primaryEntity.id}`,
    });
    crumbs.push({ name: content.ref, url: `/verse/${content.id}` });
  }
  return crumbs;
}

// SEO-optimized "related posts" for the Community feed
export async function findRelatedPosts(postId: string, limit = 3) {
  // For now, return recent posts by same author or with similar caption keywords
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) return [];

  const byAuthor = await prisma.post.findMany({
    where: { userId: post.userId, NOT: { id: postId } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return byAuthor;
}

// Generate keyword-rich anchor text for links
export function generateAnchorText(entity: { label: string; type: string }): string {
  const typeLabel = entity.type === "book" ? "biblical book" : entity.type === "person" ? "biblical figure" : entity.type;
  return `${entity.label} (${typeLabel})`;
}
