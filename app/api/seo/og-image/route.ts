import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const title = url.searchParams.get("title") || "Taste Manna";
  const description = url.searchParams.get("desc") || "Discover Scripture Daily";
  const type = url.searchParams.get("type") || "website";

  // Dynamic OG image SVG
  const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#5b53b8;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
      </linearGradient>
    </defs>

    <rect width="1200" height="630" fill="url(#grad)"/>

    <!-- Logo -->
    <rect x="50" y="50" width="60" height="60" rx="10" fill="#f0c27e"/>
    <text x="80" y="85" font-size="36" text-anchor="middle" fill="#2a1d05" font-weight="bold">✝️</text>

    <!-- Title -->
    <text x="600" y="200" font-size="64" text-anchor="middle" fill="#ffffff" font-family="Georgia, serif" font-weight="bold">
      ${title.substring(0, 30)}
    </text>

    <!-- Description -->
    <text x="600" y="320" font-size="32" text-anchor="middle" fill="rgba(255,255,255,0.9)" font-family="Arial, sans-serif">
      ${description.substring(0, 50)}
    </text>

    <!-- Type badge -->
    <rect x="1000" y="550" width="150" height="60" rx="8" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
    <text x="1075" y="590" font-size="20" text-anchor="middle" fill="#f0c27e" font-weight="bold">
      ${type.toUpperCase()}
    </text>
  </svg>`;

  return new NextResponse(svg, {
    headers: { "Content-Type": "image/svg+xml" },
  });
}
