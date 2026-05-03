import { getLogger } from "@logtape/logtape";
import { createMiddleware } from "hono/factory";

import type { AppEnv } from "../types";

/** Request id + LogTape logger on Hono context (for tRPC and HTTP error handler). */
export const requestContextMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const requestId = crypto.randomUUID();
  c.set("requestId", requestId);
  c.set("logger", getLogger(["deck-pack", "request"]));
  c.header("X-Request-Id", requestId);
  await next();
});
