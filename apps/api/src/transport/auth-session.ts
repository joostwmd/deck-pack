import { auth } from "@deck-pack/auth/server";
import { createMiddleware } from "hono/factory";

import type { AppEnv } from "../types";

/**
 * One `auth.api.getSession()` per request. Populates Hono context for tRPC.
 * Does not reject unauthenticated users — public procedures must still work.
 */
export const sessionMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
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
