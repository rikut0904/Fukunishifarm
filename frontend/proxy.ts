import { NextResponse, type NextRequest } from "next/server";

const DEFAULT_API_BASE_URL = "http://localhost:8080";

function getApiBaseUrl() {
  return (
    process.env.API_INTERNAL_BASE_URL ??
    process.env.API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    DEFAULT_API_BASE_URL
  ).replace(/\/$/, "");
}

function isBypassedPath(pathname: string) {
  return (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/migration") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/img") ||
    pathname.startsWith("/PDF") ||
    pathname === "/favicon.ico"
  );
}

export async function proxy(request: NextRequest) {
  if (isBypassedPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  try {
    const response = await fetch(`${getApiBaseUrl()}/healthz`, { cache: "no-store" });
    if (response.ok) {
      const payload = (await response.json()) as { migrated?: boolean };
      if (payload.migrated === false) {
        return NextResponse.redirect(new URL("/migration", request.url));
      }
    }
  } catch {
    // Backend unavailable or unreachable. Let the request proceed so the page can render fallback UI.
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
