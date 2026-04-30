import { appAuth, opsAuth } from "@deck-pack/auth/server";
import { createMiddleware } from "hono/factory";

import type { AppEnv } from "../types";

/**
 * Resolves the session for either ops or app auth (cookie names differ by instance).
 * Populates Hono context for tRPC. Does not reject unauthenticated users.
 */
export const sessionMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const session =
    (await opsAuth.api.getSession({
      headers: c.req.raw.headers,
    })) ??
    (await appAuth.api.getSession({
      headers: c.req.raw.headers,
    }));

  if (!session) {
    c.set("user", null);
    c.set("session", null);
  } else {
    c.set("user", session.user);
    c.set("session", session);
  }

  await next();
});
