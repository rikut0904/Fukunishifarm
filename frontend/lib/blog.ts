import { ApiError } from "@/lib/api";
import { formatBlogDate } from "@/lib/blog-format";
import type { BlogPost, PublicBlogCatalogState, PublicBlogPostState } from "@/lib/blog-types";
import { PUBLIC_CONTENT_REVALIDATE_SECONDS } from "@/lib/cache";
import { htmlExcerpt, htmlToPlainText } from "@/lib/html";
import { cache } from "react";

const DEFAULT_LIST_LIMIT = 6;

function normalizeBlogPost(post: unknown): BlogPost | null {
  if (!post || typeof post !== "object") {
    return null;
  }

  const candidate = post as Partial<BlogPost>;
  const id = candidate.id?.trim() ?? "";
  const title = candidate.title?.trim() ?? "";
  if (!id || !title) {
    return null;
  }

  const content = candidate.content ?? candidate.body ?? "";
  const excerpt = normalizeExcerpt(candidate.excerpt, content);
  const eyecatch = normalizeBlogImage(candidate.eyecatch);

  return {
    ...candidate,
    id,
    title,
    slug: candidate.slug?.trim() ?? "",
    content,
    excerpt,
    eyecatch,
  } as BlogPost;
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
