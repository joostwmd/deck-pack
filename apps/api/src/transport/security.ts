import { secureHeaders } from "hono/secure-headers";
import type { MiddlewareHandler } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

import { env } from "@deck-pack/env/server";

/** Allow browser frontends (different ports/origins) to read API responses. */
export const securityHeadersMiddleware = secureHeaders({
  crossOriginResourcePolicy: "cross-origin",
});

const CORS_ALLOW_METHODS = "GET, POST, PUT, DELETE, OPTIONS";
const CORS_ALLOW_HEADERS = "Content-Type, Authorization, X-Requested-With, Accept, Origin";
const CORS_EXPOSE_HEADERS = "X-Request-Id, set-auth-token";

export function resolveCorsOrigin(requestOrigin: string | undefined): string | null {
  if (!requestOrigin) {
    return null;
  }

  return env.CORS_ORIGINS.includes(requestOrigin) ? requestOrigin : null;
}

function setCorsHeaders(headers: Headers, matchedOrigin: string | null): void {
  if (matchedOrigin) {
    headers.set("Access-Control-Allow-Origin", matchedOrigin);
    headers.set("Access-Control-Allow-Credentials", "true");
    headers.append("Vary", "Origin");
  }

  headers.set("Access-Control-Allow-Methods", CORS_ALLOW_METHODS);
  headers.set("Access-Control-Allow-Headers", CORS_ALLOW_HEADERS);
  headers.set("Access-Control-Expose-Headers", CORS_EXPOSE_HEADERS);
}

/** Apply CORS headers to a Response (e.g. Better Auth handler output). */
export function applyCorsToResponse(
  requestOrigin: string | undefined,
  response: Response,
): Response {
  const matchedOrigin = resolveCorsOrigin(requestOrigin);
  const headers = new Headers(response.headers);
  setCorsHeaders(headers, matchedOrigin);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * CORS for all routes. Headers are applied *after* `next()` so they stick on
 * raw `Response` returns from `@hono/trpc-server` / Better Auth wrappers.
 */
export const corsMiddleware: MiddlewareHandler = async (c, next) => {
  const matchedOrigin = resolveCorsOrigin(c.req.header("Origin"));

  if (c.req.method === "OPTIONS") {
    const headers = new Headers();
    setCorsHeaders(headers, matchedOrigin);
    return new Response(null, { status: 204 as ContentfulStatusCode, headers });
  }

  await next();

  setCorsHeaders(c.res.headers, matchedOrigin);
};
