import { NextResponse, type NextRequest } from "next/server";

function getApiBaseUrl() {
  const apiBaseUrl =
    process.env.API_INTERNAL_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "";

  return apiBaseUrl.replace(/\/$/, "");
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

  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) {
    return NextResponse.next();
  }

  try {
    const response = await fetch(`${apiBaseUrl}/healthz`, { cache: "no-store" });
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
