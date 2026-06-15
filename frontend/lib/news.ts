import { ApiError, apiFetch, isMigrationRequiredError } from "@/lib/api";

export type NewsItem = {
  id: number;
  date: string;
  title: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type NewsCatalog = {
  items: NewsItem[];
};

export type NewsItemInput = {
  date: string;
  title: string;
  sortOrder: number;
};

export type NewsCatalogInput = {
  items: NewsItemInput[];
};

export type NewsItemResponse = {
  item: NewsItem;
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

    return left.id - right.id;
  });
}

function getPublicApiBaseUrl() {
  const apiBaseUrl = process.env.API_INTERNAL_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!apiBaseUrl) {
    throw new Error("API_INTERNAL_BASE_URL or NEXT_PUBLIC_API_BASE_URL is required");
  }

  return apiBaseUrl.replace(/\/$/, "");
}

export async function loadPublicNewsCatalog(onMigrationRequired: () => never): Promise<PublicNewsCatalogState> {
  try {
    return {
      catalog: await fetchPublicNewsCatalog(),
      errorMessage: null,
    };
  } catch (error) {
    if (isMigrationRequiredError(error)) {
      onMigrationRequired();
    }

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
    const contentType = response.headers.get("content-type") ?? "";
    const text = await response.text();

    if (contentType.includes("application/json")) {
      let parsed: { message?: string; code?: string } | null = null;
      try {
        parsed = JSON.parse(text) as { message?: string; code?: string };
      } catch {
        parsed = null;
      }

      if (parsed) {
        const message = parsed.message ?? `API request failed: ${response.status} ${response.statusText}`;
        throw new ApiError(response.status, message, parsed.code);
      }
    }

    throw new ApiError(response.status, text || `API request failed: ${response.status} ${response.statusText}`);
  }

  const catalog = (await response.json()) as NewsCatalog;

  return {
    ...catalog,
    items: sortNewsItems(catalog.items),
  };
}

export async function fetchAdminNewsCatalog(token: string) {
  return apiFetch<NewsCatalog>("/v1/admin/news", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function updateAdminNewsCatalog(token: string, catalog: NewsCatalogInput) {
  return apiFetch<NewsCatalog>("/v1/admin/news", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(catalog),
  });
}

export async function createAdminNewsItem(token: string, item: NewsItemInput) {
  return apiFetch<NewsItemResponse>("/v1/admin/news", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(item),
  });
}

export async function updateAdminNewsItem(token: string, id: number, item: NewsItemInput) {
  return apiFetch<NewsItemResponse>(`/v1/admin/news/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(item),
  });
}

export async function deleteAdminNewsItem(token: string, id: number) {
  return apiFetch<void>(`/v1/admin/news/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
