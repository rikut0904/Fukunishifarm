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

type ApiErrorPayload = {
  message?: string;
  code?: string;
  detail?: string;
  title?: string;
  error?: string;
};

export function getApiBaseUrl() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!apiBaseUrl) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is required");
  }

  return apiBaseUrl.replace(/\/$/, "");
}

function parseApiErrorPayload(text: string, contentType: string): ApiErrorPayload | null {
  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }

  if (!contentType.includes("application/json") && !trimmed.startsWith("{")) {
    return null;
  }

  try {
    return JSON.parse(trimmed) as ApiErrorPayload;
  } catch {
    return null;
  }
}

function getApiErrorMessage(status: number, statusText: string, text: string, contentType: string) {
  const parsed = parseApiErrorPayload(text, contentType);
  if (!parsed) {
    return text || `API request failed: ${status} ${statusText}`;
  }

  return (
    parsed.message?.trim() ||
    parsed.detail?.trim() ||
    parsed.error?.trim() ||
    parsed.title?.trim() ||
    `API request failed: ${status} ${statusText}`
  );
}

function getApiErrorCode(text: string, contentType: string) {
  return parseApiErrorPayload(text, contentType)?.code;
}

export async function createApiError(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  const text = await response.text();
  const message = getApiErrorMessage(response.status, response.statusText, text, contentType);
  const code = getApiErrorCode(text, contentType);
  return new ApiError(response.status, message, code);
}

export function getDisplayErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    return error.message || fallback;
  }

  if (error instanceof Error) {
    const parsed = parseApiErrorPayload(error.message, "application/json");
    if (parsed) {
      return parsed.message?.trim() || parsed.detail?.trim() || parsed.error?.trim() || parsed.title?.trim() || fallback;
    }

    return error.message || fallback;
  }

  return fallback;
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
    throw await createApiError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function isMigrationRequiredError(error: unknown) {
  return error instanceof ApiError && error.code === "database_not_migrated";
}
