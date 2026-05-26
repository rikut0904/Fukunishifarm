const DEFAULT_API_BASE_URL = "http://localhost:8080";

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.API_BASE_URL ?? DEFAULT_API_BASE_URL;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
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

  return (await response.json()) as T;
}

export function isMigrationRequiredError(error: unknown) {
  return error instanceof ApiError && error.code === "database_not_migrated";
}
