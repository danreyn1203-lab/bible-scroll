import { NextResponse } from "next/server";

export async function GET() {
  const robots = `# Taste Manna robots.txt
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin
Disallow: /_next/
Disallow: /account.html

# Crawl delay
Crawl-delay: 1

Sitemap: ${process.env.NEXTAUTH_URL || "https://tastemanna.com"}/api/seo/sitemap
`;

  return new NextResponse(robots, {
    headers: { "Content-Type": "text/plain" },
  });
}
