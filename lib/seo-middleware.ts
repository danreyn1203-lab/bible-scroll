// Runtime middleware to inject schema.org JSON-LD into pages

import { generateOrganizationSchema, generateBreadcrumbSchema } from "./seo";

export function injectOrganizationSchema(baseUrl: string = "https://tastemanna.com"): string {
  return `<script type="application/ld+json">${JSON.stringify(generateOrganizationSchema(baseUrl), null, 2)}</script>`;
}

export function injectBreadcrumbs(items: { name: string; url: string }[], baseUrl?: string): string {
  return `<script type="application/ld+json">${JSON.stringify(generateBreadcrumbSchema(items, baseUrl), null, 2)}</script>`;
}

// For Taste Manna's static HTML head injection
export function generateHeadTags(baseUrl: string = "https://tastemanna.com"): string {
  return `
    <!-- SEO Meta Tags -->
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#c9a14a" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

    <!-- Preconnect for performance -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="dns-prefetch" href="https://analytics.google.com" />

    <!-- Structured Data -->
    ${injectOrganizationSchema(baseUrl)}
  `;
}
