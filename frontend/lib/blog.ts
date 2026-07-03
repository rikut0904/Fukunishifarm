import { ApiError } from "@/lib/api";
import { formatBlogDate } from "@/lib/blog-format";
import type { BlogPost, PublicBlogCatalogState, PublicBlogPostState } from "@/lib/blog-types";
import { PUBLIC_CONTENT_REVALIDATE_SECONDS } from "@/lib/cache";
import { htmlExcerpt, htmlToPlainText } from "@/lib/html";
import { cache } from "react";

const DEFAULT_LIST_LIMIT = 6;

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeBlogPost(post: unknown): BlogPost | null {
  if (!post || typeof post !== "object") {
    return null;
  }

  const candidate = post as Record<string, unknown>;
  const id = normalizeString(candidate.id);
  const title = normalizeString(candidate.title);
  if (!id || !title) {
    return null;
  }

  const content =
    typeof candidate.content === "string"
      ? candidate.content
      : typeof candidate.body === "string"
        ? candidate.body
        : "";
  const excerpt = normalizeExcerpt(typeof candidate.excerpt === "string" ? candidate.excerpt : undefined, content);
  const eyecatch = normalizeBlogImage(candidate.eyecatch);
  const category = normalizeBlogCategory(candidate.category);
  const publishedAt = normalizeString(candidate.publishedAt) || normalizeString(candidate.createdAt) || normalizeString(candidate.updatedAt);

  return {
    id,
    title,
    slug: normalizeString(candidate.slug),
    excerpt,
    content,
    body: typeof candidate.body === "string" ? candidate.body : undefined,
    eyecatch,
    category,
    publishedAt,
    revisedAt: normalizeString(candidate.revisedAt) || undefined,
    createdAt: normalizeString(candidate.createdAt) || undefined,
    updatedAt: normalizeString(candidate.updatedAt) || undefined,
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

function normalizeBlogCategory(category: unknown): BlogPost["category"] {
  if (!category || typeof category !== "object") {
    return null;
  }

  const candidate = category as Record<string, unknown>;
  const id = normalizeString(candidate.id);
  const name = normalizeString(candidate.name);
  if (!id && !name) {
    return null;
  }

  return {
    id,
    name,
  };
}

export function getBlogContent(post: BlogPost) {
  return post.content ?? post.body ?? "";
}

export function getBlogEyecatchUrl(post: BlogPost) {
  return post.eyecatch?.url?.trim() || post.eyecatch?.src?.trim() || "";
}

export function getBlogPath(post: BlogPost | null | undefined) {
  const normalizedId = post?.id?.trim() ?? "";
  if (!normalizedId) {
    return "/blog";
  }

  return `/blog/${encodeURIComponent(normalizedId)}`;
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
  const payload = (await response.json()) as { posts?: unknown[]; total?: number; page?: number; limit?: number };
  const posts = Array.isArray(payload?.posts) ? payload.posts : [];
  const normalizedLimit = Number.isFinite(payload?.limit) && Number(payload.limit) > 0 ? Number(payload.limit) : limit;
  const normalizedPage = Number.isFinite(payload?.page) && Number(payload.page) > 0 ? Number(payload.page) : page;
  const totalCount = Number.isFinite(payload?.total) && Number(payload.total) >= 0 ? Number(payload.total) : posts.length;
  const normalizedPosts = posts.map(normalizeBlogPost).filter((post): post is BlogPost => post !== null);

  return {
    contents: normalizedPosts,
    totalCount,
    offset: Math.max(normalizedPage - 1, 0) * normalizedLimit,
    limit: normalizedLimit,
    page: normalizedPage,
  };
}

const fetchPublicBlogPostByIdCached = cache(async (id: string) => {
  const normalizedId = id.trim();
  if (!normalizedId) {
    return null;
  }

  const response = await fetch(`${getPublicApiBaseUrl()}/v1/blog/${encodeURIComponent(normalizedId)}`, {
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
  const payload = (await response.json()) as { post?: unknown };
  if (!payload?.post) {
    throw new ApiError(response.status, "API response did not include a blog post");
  }

  const normalizedPost = normalizeBlogPost(payload.post);
  if (!normalizedPost) {
    throw new ApiError(response.status, "API response included an invalid blog post");
  }

  return normalizedPost;
});

export async function fetchPublicBlogPostById(id: string) {
  return fetchPublicBlogPostByIdCached(id);
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

function normalizeBlogImage(image: unknown): BlogPost["eyecatch"] {
  if (!image || typeof image !== "object") {
    return null;
  }

  const candidate = image as Record<string, unknown>;
  const url = normalizeString(candidate.url) || normalizeString(candidate.src);
  if (!url) {
    return null;
  }

  return {
    url,
    src: url,
    height: typeof candidate.height === "number" ? candidate.height : undefined,
    width: typeof candidate.width === "number" ? candidate.width : undefined,
  };
}

const loadPublicBlogPostCached = cache(async (id: string): Promise<PublicBlogPostState> => {
  try {
    return {
      post: await fetchPublicBlogPostById(id),
      errorMessage: null,
    };
  } catch {
    return {
      post: null,
      errorMessage: "ブログ記事を読み込めませんでした。",
    };
  }
});

export async function loadPublicBlogPost(id: string): Promise<PublicBlogPostState> {
  return loadPublicBlogPostCached(id);
}
