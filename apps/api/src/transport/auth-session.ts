import { auth } from "@deck-pack/auth/server";
import { env } from "@deck-pack/env/server";
import { getSessionCookieName } from "@deck-pack/auth/session-cookie";
import { createMiddleware } from "hono/factory";

import type { AppEnv } from "../types";

/**
 * Better Auth's bearer plugin only runs on `/api/auth/*` requests. tRPC and
 * other API routes call `getSession` directly, so mirror the bearer cookie
 * injection here and let Better Auth verify the signed session token.
 */
function headersWithBearerCookie(headers: Headers): Headers {
  const authHeader = headers.get("authorization") ?? headers.get("Authorization");
  if (!authHeader?.toLowerCase().startsWith("bearer ")) {
    return headers;
  }

  const token = authHeader.slice("bearer ".length).trim();
  if (!token) {
    return headers;
  }

  const augmented = new Headers(headers);
  const existingCookie = augmented.get("cookie");
  const sessionCookie = `${getSessionCookieName(env.BETTER_AUTH_URL)}=${token}`;
  augmented.set(
    "cookie",
    existingCookie ? `${existingCookie}; ${sessionCookie}` : sessionCookie,
  );
  return augmented;
}

/**
 * Resolves the session for unified auth. Populates Hono context for tRPC.
 * Does not reject unauthenticated users.
 */
export const sessionMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const session = await auth.api.getSession({
    headers: headersWithBearerCookie(c.req.raw.headers),
  });

  if (!session) {
    c.set("user", null);
    c.set("session", null);
  } else {
    c.set("user", session.user);
    c.set("session", session);
  }

  await next();
});
