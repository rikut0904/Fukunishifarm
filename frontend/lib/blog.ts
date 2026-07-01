import { ApiError } from "@/lib/api";
import { formatBlogDate } from "@/lib/blog-format";
import type { BlogPost, PublicBlogCatalogState, PublicBlogPostState } from "@/lib/blog-types";
import { htmlExcerpt, htmlToPlainText } from "@/lib/html";

const DEFAULT_LIST_LIMIT = 6;

function normalizeBlogPost(post: BlogPost): BlogPost {
  const content = post.content ?? post.body ?? "";
  const excerpt = normalizeExcerpt(post.excerpt, content);

  return {
    ...post,
    content,
    excerpt,
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

export async function fetchPublicBlogPosts(limit = DEFAULT_LIST_LIMIT) {
  const response = await fetch(`${getPublicApiBaseUrl()}/v1/blog?limit=${limit}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new ApiError(response.status, `API request failed: ${response.status} ${response.statusText}`);
  }
  const payload = (await response.json()) as { posts: BlogPost[] };
  const posts = Array.isArray(payload?.posts) ? payload.posts : [];

  return {
    contents: posts.map(normalizeBlogPost),
    totalCount: posts.length,
    offset: 0,
    limit,
  };
}

export async function fetchPublicBlogPostBySlug(slug: string) {
  const normalizedSlug = slug.trim();
  if (!normalizedSlug) {
    return null;
  }

  const response = await fetch(`${getPublicApiBaseUrl()}/v1/blog/${encodeURIComponent(normalizedSlug)}`, {
    cache: "no-store",
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
}

export async function loadPublicBlogPosts(limit = DEFAULT_LIST_LIMIT): Promise<PublicBlogCatalogState> {
  try {
    const response = await fetchPublicBlogPosts(limit);
    return {
      posts: response.contents,
      errorMessage: null,
    };
  } catch {
    return {
      posts: null,
      errorMessage: "ブログ記事を読み込めませんでした。",
    };
  }
}

export async function loadPublicBlogPost(slug: string): Promise<PublicBlogPostState> {
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
}
