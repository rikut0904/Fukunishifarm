import { ApiError, apiFetch, isMigrationRequiredError } from "@/lib/api";
import { PUBLIC_CONTENT_REVALIDATE_SECONDS } from "@/lib/cache";

export type GrapeItem = {
  id: number;
  name: string;
  description: string;
  isOnSale: boolean;
  imagePath: string;
  imageFocus: string;
  imageScale: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type GrapeCatalog = {
  items: GrapeItem[];
};

export type GrapeItemInput = {
  name: string;
  description: string;
  isOnSale: boolean;
  imagePath: string;
  imageFocus: string;
  imageScale: number;
  sortOrder: number;
};

export type GrapeCatalogInput = {
  items: GrapeItemInput[];
};

export type PublicGrapeCatalogState = {
  catalog: GrapeCatalog | null;
  errorMessage: string | null;
};

type GrapeItemEnvelope = {
  item: GrapeItem;
};

function sortGrapeItems(items: GrapeItem[]) {
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

export async function loadPublicGrapeCatalog(onMigrationRequired: () => never): Promise<PublicGrapeCatalogState> {
  try {
    return {
      catalog: await fetchPublicGrapeCatalog(),
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

export async function fetchPublicGrapeCatalog() {
  const response = await fetch(`${getPublicApiBaseUrl()}/v1/grapes`, {
    next: {
      revalidate: PUBLIC_CONTENT_REVALIDATE_SECONDS,
    },
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

  const catalog = (await response.json()) as GrapeCatalog;

  return {
    ...catalog,
    items: sortGrapeItems(catalog.items),
  };
}

export async function fetchAdminGrapeCatalog(token: string) {
  return apiFetch<GrapeCatalog>("/v1/admin/grapes", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function updateAdminGrapeCatalog(token: string, catalog: GrapeCatalogInput) {
  return apiFetch<GrapeCatalog>("/v1/admin/grapes", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(catalog),
  });
}

export async function createAdminGrapeItem(token: string, item: GrapeItemInput) {
  const response = await apiFetch<GrapeItemEnvelope>("/v1/admin/grapes", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(item),
  });

  return response.item;
}

export async function updateAdminGrapeItem(token: string, id: number, item: GrapeItemInput) {
  const response = await apiFetch<GrapeItemEnvelope>(`/v1/admin/grapes/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(item),
  });

  return response.item;
}

export async function deleteAdminGrapeItem(token: string, id: number) {
  await apiFetch<void>(`/v1/admin/grapes/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
