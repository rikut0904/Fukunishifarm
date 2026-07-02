export function getSiteBaseUrl() {
  const configuredBaseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.SITE_BASE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL;

  if (!configuredBaseUrl) {
    return "http://localhost:3000";
  }

  const normalizedBaseUrl = configuredBaseUrl.startsWith("http")
    ? configuredBaseUrl
    : `https://${configuredBaseUrl}`;

  return normalizedBaseUrl.replace(/\/$/, "");
}

export function toAbsoluteUrl(path: string) {
  return new URL(path, `${getSiteBaseUrl()}/`).toString();
}
