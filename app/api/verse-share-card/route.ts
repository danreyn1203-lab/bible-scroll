import { NextResponse } from "next/server";

// Generate a beautiful shareable verse card image.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const verse = url.searchParams.get("text") || "John 3:16";
  const reference = url.searchParams.get("ref") || "John 3:16";
  const author = url.searchParams.get("author") || "King James Version";

  // SVG verse card with gradient background
  const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="1200" height="630" fill="url(#grad)"/>
    <rect x="60" y="60" width="1080" height="510" rx="20" fill="rgba(255,255,255,0.95)"/>

    <!-- Verse text -->
    <text x="600" y="200" font-size="48" font-family="Georgia, serif" text-anchor="middle" fill="#333" font-weight="bold" font-style="italic">
      "${verse}"
    </text>

    <!-- Reference -->
    <text x="600" y="380" font-size="36" font-family="Arial, sans-serif" text-anchor="middle" fill="#667eea" font-weight="bold">
      ${reference}
    </text>

    <!-- Translation -->
    <text x="600" y="450" font-size="24" font-family="Arial, sans-serif" text-anchor="middle" fill="#999">
      ${author}
    </text>

    <!-- Logo/watermark -->
    <text x="600" y="570" font-size="18" font-family="Arial, sans-serif" text-anchor="middle" fill="#ccc">
      Simply Manna — Bible Discovery
    </text>
  </svg>`;

  return new NextResponse(svg, {
    headers: { "Content-Type": "image/svg+xml" },
  });
}
