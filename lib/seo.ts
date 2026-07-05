// SEO utilities — metadata generation, structured data, canonical URLs
// Designed to work across any domain and deployment context

export type MetadataInput = {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  ogType?: "website" | "article";
  keywords?: string[];
  author?: string | { name: string; url?: string };
  publishedAt?: Date;
  updatedAt?: Date;
};

export function generateMetaTags(input: MetadataInput, baseUrl: string = "https://simplymanna.com") {
  const canonical = input.canonical ? new URL(input.canonical, baseUrl).toString() : baseUrl;
  const ogImage = input.ogImage || `${baseUrl}/og-taste-manna.png`;
  const keywords = (input.keywords || []).join(", ");

  return {
    title: `${input.title} | Simply Manna — Bible Discovery`,
    description: input.description,
    canonical,
    keywords,
    og: {
      title: input.title,
      description: input.description,
      type: input.ogType || "website",
      url: canonical,
      image: ogImage,
      siteName: "Simply Manna",
    },
    twitter: {
      card: "summary_large_image",
      site: "@SimplyManna",
      title: input.title,
      description: input.description,
      image: ogImage,
    },
    author: input.author,
    publishedTime: input.publishedAt?.toISOString(),
    modifiedTime: input.updatedAt?.toISOString(),
  };
}

export function generateArticleSchema(input: Omit<MetadataInput, "author"> & { url: string; author: { name: string; url?: string } }) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: input.description,
    url: input.url,
    image: input.ogImage || "/og-default.png",
    datePublished: input.publishedAt?.toISOString(),
    dateModified: input.updatedAt?.toISOString(),
    author: {
      "@type": "Person",
      name: input.author.name,
      ...(input.author.url && { url: input.author.url }),
    },
    publisher: {
      "@type": "Organization",
      name: "Simply Manna",
      logo: {
        "@type": "ImageObject",
        url: "/logo.png",
        width: 60,
        height: 60,
      },
    },
    mainEntity: {
      "@type": "WebPage",
      "@id": input.url,
    },
  };
}

export function generateOrganizationSchema(baseUrl: string = "https://simplymanna.com") {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Simply Manna",
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    description: "AI-powered Bible discovery platform with personalized verse recommendations, community features, and deep learning.",
    sameAs: [
      "https://twitter.com/SimplyManna",
      "https://instagram.com/SimplyManna",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Support",
      email: "support@simplymanna.com",
    },
  };
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[], baseUrl: string = "https://simplymanna.com") {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: new URL(item.url, baseUrl).toString(),
    })),
  };
}

export function generateFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(faq => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

const KEYWORDS_BY_TOPIC: Record<string, string[]> = {
  verse: ["Bible verse", "scripture", "daily verse", "Bible reading", "spiritual growth"],
  history: ["Bible history", "biblical archaeology", "ancient Israel", "historical context"],
  theology: ["theology", "biblical doctrine", "Christian theology", "theological study"],
  catechism: ["catechism", "Bible Q&A", "biblical answers", "theological questions"],
  funfact: ["Bible facts", "biblical trivia", "interesting Bible facts"],
  community: ["Bible community", "Christian fellowship", "prayer community", "Bible groups"],
};

export function getKeywordsForContent(category: string): string[] {
  return KEYWORDS_BY_TOPIC[category] || [];
}

export function generateAltText(item: { ref?: string; text?: string; category?: string }): string {
  if (item.ref) return `Scripture passage: ${item.ref}`;
  if (item.category === "verse") return "Bible verse";
  if (item.category === "history") return "Historical Bible context";
  if (item.category === "theology") return "Theological concept";
  return "Bible content";
}
