import { secureHeaders } from "hono/secure-headers";
import type { MiddlewareHandler } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

import { env } from "@deck-pack/env/server";

export const securityHeadersMiddleware = secureHeaders();

const CORS_ALLOW_METHODS = "GET, POST, PUT, DELETE, OPTIONS";
const CORS_ALLOW_HEADERS = "Content-Type, Authorization, X-Requested-With, Accept, Origin";
const CORS_EXPOSE_HEADERS = "X-Request-Id, set-auth-token";

export function resolveCorsOrigin(requestOrigin: string | undefined): string | null {
  if (!requestOrigin) {
    return null;
  }

  return env.CORS_ORIGINS.includes(requestOrigin) ? requestOrigin : null;
}

/** Apply CORS headers to a Response (e.g. Better Auth handler output). */
export function applyCorsToResponse(
  requestOrigin: string | undefined,
  response: Response,
): Response {
  const matchedOrigin = resolveCorsOrigin(requestOrigin);
  if (!matchedOrigin) {
    return response;
  }

  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", matchedOrigin);
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.set("Vary", "Origin");
  headers.set("Access-Control-Allow-Methods", CORS_ALLOW_METHODS);
  headers.set("Access-Control-Allow-Headers", CORS_ALLOW_HEADERS);
  headers.set("Access-Control-Expose-Headers", CORS_EXPOSE_HEADERS);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export const corsMiddleware: MiddlewareHandler = async (c, next) => {
  const matchedOrigin = resolveCorsOrigin(c.req.header("Origin"));

  if (matchedOrigin) {
    c.header("Access-Control-Allow-Origin", matchedOrigin);
    c.header("Access-Control-Allow-Credentials", "true");
    c.header("Vary", "Origin");
  }

  c.header("Access-Control-Allow-Methods", CORS_ALLOW_METHODS);
  c.header("Access-Control-Allow-Headers", CORS_ALLOW_HEADERS);
  c.header("Access-Control-Expose-Headers", CORS_EXPOSE_HEADERS);

  if (c.req.method === "OPTIONS") {
    return c.text("", 204 as ContentfulStatusCode);
  }

  await next();
};
