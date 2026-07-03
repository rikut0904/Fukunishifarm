import type { MetadataRoute } from "next";

import { getSiteBaseUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const siteBaseUrl = getSiteBaseUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/login", "/migration"],
      },
    ],
    sitemap: `${siteBaseUrl}/sitemap.xml`,
    host: siteBaseUrl,
  };
}
