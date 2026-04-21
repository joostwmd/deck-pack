import { env } from "@deck-pack/env/server";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";

export const securityHeadersMiddleware = secureHeaders();

export const corsMiddleware = cors({
  origin: env.CORS_ORIGINS,
  allowMethods: ["GET", "POST", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
  credentials: true,
});
