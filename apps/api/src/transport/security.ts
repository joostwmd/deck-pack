import { secureHeaders } from "hono/secure-headers";
import type { MiddlewareHandler } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

import { env } from "@deck-pack/env/server";

export const securityHeadersMiddleware = secureHeaders();

export const corsMiddleware: MiddlewareHandler = async (c, next) => {
  const requestOrigin = c.req.header("Origin");

  // Allow specific trusted origins (from CORS_ORIGINS env) so that
  // Access-Control-Allow-Credentials: true is valid per the CORS spec.
  // Wildcards (*) cannot be combined with credentials.
  const allowedOrigins = env.CORS_ORIGINS;
  const matchedOrigin =
    requestOrigin && allowedOrigins.includes(requestOrigin) ? requestOrigin : null;

  if (matchedOrigin) {
    c.header("Access-Control-Allow-Origin", matchedOrigin);
    c.header("Access-Control-Allow-Credentials", "true");
    c.header("Vary", "Origin");
  }

  c.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  c.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  c.header("Access-Control-Expose-Headers", "X-Request-Id");

  if (c.req.method === "OPTIONS") {
    return c.text("", 204 as ContentfulStatusCode);
  }

  await next();
};
