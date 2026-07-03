import type { MetadataRoute } from "next";

import { fetchPublicBlogPosts, getBlogPath } from "@/lib/blog";
import { fetchPublicNewsCatalog } from "@/lib/news";
import { getSiteBaseUrl } from "@/lib/site";

const SITEMAP_FETCH_TIMEOUT_MS = 5000;

const STATIC_ROUTES = [
  "/",
  "/about",
  "/access",
  "/blog",
  "/blog/archive",
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

function toLastModifiedDate(value: string | undefined): Date | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }

  return parsed;
}

async function withSitemapTimeout<T>(promise: Promise<T>): Promise<T> {
  return await Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error("sitemap fetch timeout")), SITEMAP_FETCH_TIMEOUT_MS);
    }),
  ]);
}

async function loadBlogEntries(siteBaseUrl: string): Promise<MetadataRoute.Sitemap> {
  try {
    const { contents } = await withSitemapTimeout(fetchPublicBlogPosts(1, 100));

    return contents.map((post) => ({
      url: new URL(getBlogPath(post), `${siteBaseUrl}/`).toString(),
      lastModified: toLastModifiedDate(post.updatedAt || post.publishedAt || post.createdAt || undefined),
    }));
  } catch {
    return [];
  }
}

async function loadNewsEntries(siteBaseUrl: string): Promise<MetadataRoute.Sitemap> {
  try {
    const { items } = await withSitemapTimeout(fetchPublicNewsCatalog(1, 100));
    if (items.length === 0) {
      return [];
    }

    const latestPublishedAt = items.reduce<string | undefined>((latest, item) => {
      if (!latest) {
        return item.updatedAt || item.publishedAt || item.createdAt || undefined;
      }

      const candidate = item.updatedAt || item.publishedAt || item.createdAt;
      if (!candidate) {
        return latest;
      }

      return candidate > latest ? candidate : latest;
    }, undefined);

    return [
      {
        url: new URL("/news", `${siteBaseUrl}/`).toString(),
        lastModified: toLastModifiedDate(latestPublishedAt),
      },
    ];
  } catch {
    return [];
  }
}
