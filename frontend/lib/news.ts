import { ApiError } from "@/lib/api";

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
};

export type PublicNewsCatalogState = {
  catalog: NewsCatalog | null;
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

export async function loadPublicNewsCatalog(): Promise<PublicNewsCatalogState> {
  try {
    return {
      catalog: await fetchPublicNewsCatalog(),
      errorMessage: null,
    };
  } catch {
    return {
      catalog: null,
      errorMessage: "データが取得できませんでした。",
    };
  }
}

export async function fetchPublicNewsCatalog() {
  const response = await fetch(`${getPublicApiBaseUrl()}/v1/news`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new ApiError(response.status, `API request failed: ${response.status} ${response.statusText}`);
  }

  const catalog = (await response.json()) as NewsCatalog;

  return {
    ...catalog,
    items: sortNewsItems(catalog.items),
  };
}
