import { NextResponse, type NextRequest } from "next/server";

type RouteContext = {
  params: Promise<{ path?: string[] }> | { path?: string[] };
};

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "content-encoding",
  "content-length",
  "host",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

function getBackendApiBaseUrl() {
  const apiBaseUrl = process.env.API_INTERNAL_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!apiBaseUrl) {
    throw new Error("API_INTERNAL_BASE_URL or NEXT_PUBLIC_API_BASE_URL is required");
  }

  return apiBaseUrl.replace(/\/$/, "");
}

function createProxyHeaders(request: NextRequest) {
  const headers = new Headers(request.headers);
  for (const header of HOP_BY_HOP_HEADERS) {
    headers.delete(header);
  }

  return headers;
}

function createResponseHeaders(response: Response) {
  const headers = new Headers(response.headers);
  for (const header of HOP_BY_HOP_HEADERS) {
    headers.delete(header);
  }

  return headers;
}

async function proxyApiRequest(request: NextRequest, context: RouteContext) {
  const params = await Promise.resolve(context.params);
  const path = params.path?.map(encodeURIComponent).join("/") ?? "";
  let targetUrl: URL;
  try {
    targetUrl = new URL(`${getBackendApiBaseUrl()}/v1/${path}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "API proxy is not configured";
    return NextResponse.json(
      {
        code: "api_proxy_not_configured",
        message,
      },
      { status: 500 },
    );
  }
  targetUrl.search = request.nextUrl.search;

  let response: Response;
  try {
    response = await fetch(targetUrl, {
      method: request.method,
      headers: createProxyHeaders(request),
      body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer(),
      cache: "no-store",
      redirect: "manual",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Backend API request failed";
    return NextResponse.json(
      {
        code: "backend_api_unreachable",
        message,
      },
      { status: 502 },
    );
  }

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: createResponseHeaders(response),
  });
}

export function GET(request: NextRequest, context: RouteContext) {
  return proxyApiRequest(request, context);
}

export function POST(request: NextRequest, context: RouteContext) {
  return proxyApiRequest(request, context);
}

export function PUT(request: NextRequest, context: RouteContext) {
  return proxyApiRequest(request, context);
}

export function PATCH(request: NextRequest, context: RouteContext) {
  return proxyApiRequest(request, context);
}

export function DELETE(request: NextRequest, context: RouteContext) {
  return proxyApiRequest(request, context);
}
