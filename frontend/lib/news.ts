import { createApiError, getDisplayErrorMessage } from "@/lib/api";
import { PUBLIC_CONTENT_REVALIDATE_SECONDS } from "@/lib/cache";

export type NewsItem = {
  id: string;
  title: string;
  sortOrder: number;
  publishedAt: string;
  createdAt?: string;
  updatedAt?: string;
};

export type NewsCatalog = {
  items: NewsItem[];
  total: number;
  page: number;
  limit: number;
};

export type PublicNewsCatalogState = {
  catalog: NewsCatalog | null;
  status: "loaded" | "empty" | "error";
  errorMessage: string | null;
};

function sortNewsItems(items: NewsItem[]) {
  return [...items].sort((left, right) => {
    if (left.sortOrder !== right.sortOrder) {
      return left.sortOrder - right.sortOrder;
    }

    return left.publishedAt < right.publishedAt ? 1 : -1;
  });
}

function getPublicApiBaseUrl() {
  const apiBaseUrl = process.env.API_INTERNAL_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!apiBaseUrl) {
    throw new Error("API_INTERNAL_BASE_URL or NEXT_PUBLIC_API_BASE_URL is required");
  }

  return apiBaseUrl.replace(/\/$/, "");
}

export async function loadPublicNewsCatalog(page = 1, limit = 5): Promise<PublicNewsCatalogState> {
  try {
    const catalog = await fetchPublicNewsCatalog(page, limit);
    const isEmpty = catalog.items.length === 0;
    return {
      catalog,
      status: isEmpty ? "empty" : "loaded",
      errorMessage: null,
    };
  } catch (error) {
    return {
      catalog: null,
      status: "error",
      errorMessage: getDisplayErrorMessage(error, "データが取得できませんでした。"),
    };
  }
}

export async function fetchPublicNewsCatalog(page = 1, limit = 5) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  const response = await fetch(`${getPublicApiBaseUrl()}/v1/news?${params.toString()}`, {
    next: {
      revalidate: PUBLIC_CONTENT_REVALIDATE_SECONDS,
    },
  });

  if (!response.ok) {
    throw await createApiError(response);
  }

  const catalog = (await response.json()) as NewsCatalog;

  return {
    ...catalog,
    total: Number.isFinite(catalog.total) ? catalog.total : catalog.items.length,
    page: Number.isFinite(catalog.page) ? catalog.page : page,
    limit: Number.isFinite(catalog.limit) && catalog.limit > 0 ? catalog.limit : limit,
    items: sortNewsItems(Array.isArray(catalog.items) ? catalog.items : []),
  };
}
