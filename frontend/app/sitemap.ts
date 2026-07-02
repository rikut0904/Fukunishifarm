import type { MetadataRoute } from "next";

import { fetchPublicBlogPosts, getBlogPath } from "@/lib/blog";
import { fetchPublicNewsCatalog } from "@/lib/news";
import { getSiteBaseUrl } from "@/lib/site";

const STATIC_ROUTES = [
  "/",
  "/about",
  "/access",
  "/blog",
  "/contact",
  "/download",
  "/reservation",
  "/tirashi",
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteBaseUrl = getSiteBaseUrl();
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: new URL(route, `${siteBaseUrl}/`).toString(),
    lastModified: now,
  }));

  const [blogEntries, newsEntries] = await Promise.all([
    loadBlogEntries(siteBaseUrl),
    loadNewsEntries(siteBaseUrl),
  ]);

  return [...staticEntries, ...blogEntries, ...newsEntries];
}

async function loadBlogEntries(siteBaseUrl: string): Promise<MetadataRoute.Sitemap> {
  try {
    const { contents } = await fetchPublicBlogPosts(100);

    return contents.map((post) => ({
      url: new URL(getBlogPath(post), `${siteBaseUrl}/`).toString(),
      lastModified: post.updatedAt ?? post.publishedAt ?? post.createdAt ?? undefined,
    }));
  } catch {
    return [];
  }
}

async function loadNewsEntries(siteBaseUrl: string): Promise<MetadataRoute.Sitemap> {
  try {
    const { items } = await fetchPublicNewsCatalog();
    if (items.length === 0) {
      return [];
    }

    const latestPublishedAt = items.reduce<string | undefined>((latest, item) => {
      if (!latest) {
        return item.updatedAt ?? item.publishedAt ?? item.createdAt;
      }

      const candidate = item.updatedAt ?? item.publishedAt ?? item.createdAt;
      if (!candidate) {
        return latest;
      }

      return candidate > latest ? candidate : latest;
    }, undefined);

    return [
      {
        url: new URL("/news", `${siteBaseUrl}/`).toString(),
        lastModified: latestPublishedAt,
      },
    ];
  } catch {
    return [];
  }
}
