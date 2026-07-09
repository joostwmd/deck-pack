import { secureHeaders } from "hono/secure-headers";
import type { MiddlewareHandler } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export const securityHeadersMiddleware = secureHeaders();

export const corsMiddleware: MiddlewareHandler = async (c, next) => {
  // Set CORS headers
  c.header("Access-Control-Allow-Origin", "*");
  c.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  c.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  c.header("Access-Control-Allow-Credentials", "true");
  c.header("Access-Control-Expose-Headers", "X-Request-Id");

  // Handle preflight OPTIONS requests
  if (c.req.method === "OPTIONS") {
    return c.text("", 204 as ContentfulStatusCode);
  }

  await next();
};
