import { ApiError } from "@/lib/api";
import { formatBlogDate } from "@/lib/blog-format";
import type { BlogPost, PublicBlogCatalogState, PublicBlogPostState } from "@/lib/blog-types";
import { PUBLIC_CONTENT_REVALIDATE_SECONDS } from "@/lib/cache";
import { htmlExcerpt, htmlToPlainText } from "@/lib/html";
import { cache } from "react";

const DEFAULT_LIST_LIMIT = 6;

function normalizeBlogPost(post: BlogPost): BlogPost {
  const content = post.content ?? post.body ?? "";
  const excerpt = normalizeExcerpt(post.excerpt, content);
  const eyecatch = normalizeBlogImage(post.eyecatch);

  return {
    ...post,
    content,
    excerpt,
    eyecatch,
  };
}

export { formatBlogDate };

function normalizeExcerpt(excerpt: string | null | undefined, content: string) {
  const trimmed = excerpt?.trim() ?? "";
  if (trimmed) {
    return htmlToPlainText(trimmed);
  }

  return htmlExcerpt(content, 120);
}

export function getBlogContent(post: BlogPost) {
  return post.content ?? post.body ?? "";
}

export function getBlogEyecatchUrl(post: BlogPost) {
  return post.eyecatch?.url?.trim() || post.eyecatch?.src?.trim() || "";
}

export function getBlogPath(post: BlogPost) {
  const segment = (post.slug?.trim() || post.id).trim();
  return `/blog/${encodeURIComponent(segment)}`;
}

function getPublicApiBaseUrl() {
  const apiBaseUrl = process.env.API_INTERNAL_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!apiBaseUrl) {
    throw new Error("API_INTERNAL_BASE_URL or NEXT_PUBLIC_API_BASE_URL is required");
  }

  return apiBaseUrl.replace(/\/$/, "");
}

export async function fetchPublicBlogPosts(page = 1, limit = DEFAULT_LIST_LIMIT) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  const response = await fetch(`${getPublicApiBaseUrl()}/v1/blog?${params.toString()}`, {
    next: {
      revalidate: PUBLIC_CONTENT_REVALIDATE_SECONDS,
    },
  });
  if (!response.ok) {
    throw new ApiError(response.status, `API request failed: ${response.status} ${response.statusText}`);
  }
  const payload = (await response.json()) as { posts?: BlogPost[]; total?: number; page?: number; limit?: number };
  const posts = Array.isArray(payload?.posts) ? payload.posts : [];
  const normalizedLimit = Number.isFinite(payload?.limit) && Number(payload.limit) > 0 ? Number(payload.limit) : limit;
  const normalizedPage = Number.isFinite(payload?.page) && Number(payload.page) > 0 ? Number(payload.page) : page;
  const totalCount = Number.isFinite(payload?.total) && Number(payload.total) >= 0 ? Number(payload.total) : posts.length;

  return {
    contents: posts.map(normalizeBlogPost),
    totalCount,
    offset: Math.max(normalizedPage - 1, 0) * normalizedLimit,
    limit: normalizedLimit,
    page: normalizedPage,
  };
}

const fetchPublicBlogPostBySlugCached = cache(async (slug: string) => {
  const normalizedSlug = slug.trim();
  if (!normalizedSlug) {
    return null;
  }

  const response = await fetch(`${getPublicApiBaseUrl()}/v1/blog/${encodeURIComponent(normalizedSlug)}`, {
    next: {
      revalidate: PUBLIC_CONTENT_REVALIDATE_SECONDS,
    },
  });
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new ApiError(response.status, `API request failed: ${response.status} ${response.statusText}`);
  }
  const payload = (await response.json()) as { post: BlogPost };
  if (!payload?.post) {
    throw new ApiError(response.status, "API response did not include a blog post");
  }
  return normalizeBlogPost(payload.post);
});

export async function fetchPublicBlogPostBySlug(slug: string) {
  return fetchPublicBlogPostBySlugCached(slug);
}

export async function loadPublicBlogPosts(page = 1, limit = DEFAULT_LIST_LIMIT): Promise<PublicBlogCatalogState> {
  try {
    const response = await fetchPublicBlogPosts(page, limit);
    return {
      posts: response.contents,
      totalCount: response.totalCount,
      page: response.page,
      limit: response.limit,
      errorMessage: null,
    };
  } catch {
    return {
      posts: null,
      totalCount: 0,
      page,
      limit,
      errorMessage: "ブログ記事を読み込めませんでした。",
    };
  }
}

function normalizeBlogImage(image: BlogPost["eyecatch"]) {
  if (!image) {
    return image;
  }

  const url = image.url?.trim() || image.src?.trim() || "";
  if (!url) {
    return null;
  }

  return {
    ...image,
    url,
    src: url,
  };
}

const loadPublicBlogPostCached = cache(async (slug: string): Promise<PublicBlogPostState> => {
  try {
    return {
      post: await fetchPublicBlogPostBySlug(slug),
      errorMessage: null,
    };
  } catch {
    return {
      post: null,
      errorMessage: "ブログ記事を読み込めませんでした。",
    };
  }
});

export async function loadPublicBlogPost(slug: string): Promise<PublicBlogPostState> {
  return loadPublicBlogPostCached(slug);
}
