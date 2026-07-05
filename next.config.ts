import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Manna's static UI lives in /public as plain files (index.html, app.js,
     src/**). Visiting "/" should land there instead of the old Phase 1
     test page (moved to /dev-test). */
  async redirects() {
    return [{ source: "/", destination: "/index.html", permanent: false }];
  },

  /* SEO: Security + caching headers */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "geolocation=(), microphone=(), camera=()" },
        ],
      },
      {
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=60, s-maxage=3600" }],
      },
      {
        source: "/:path*\\.(jpg|jpeg|png|gif|svg|webp|ico|woff|woff2)$",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },

  compress: true,
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
};

export default nextConfig;

// Enable Cloudflare bindings during local `next dev` (no-op in production build).
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
