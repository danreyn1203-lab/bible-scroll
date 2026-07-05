// SEO metadata for the root layout
// This gets merged with the runtime metadata middleware

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Simply Manna — AI-Powered Bible Discovery & Verses",
  description:
    "Discover personalized Bible verses through AI-guided recommendations, join a thriving community of believers, and deepen your faith with study plans. Free Bible app for Christians seeking spiritual growth.",
  keywords: [
    "Bible app",
    "daily verses",
    "Bible study",
    "AI Bible study",
    "personalized Bible reading",
    "Christian community",
    "prayer requests",
    "Bible learning",
    "scripture discovery",
  ],
  openGraph: {
    title: "Simply Manna — Discover Scripture Daily",
    description: "AI-personalized Bible discovery, community prayer, and spiritual growth.",
    type: "website",
    locale: "en_US",
    images: [{ url: "/og-taste-manna.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Simply Manna — Bible Discovery",
    description: "Discover verses that speak to you. Join a community. Grow in faith.",
    images: ["/og-taste-manna.png"],
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "https://simplymanna.com" },
};
