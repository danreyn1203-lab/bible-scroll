import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/admin.html", "/private/"],
      },
    ],
    sitemap: "https://simplymanna.com/sitemap.xml",
  };
}
