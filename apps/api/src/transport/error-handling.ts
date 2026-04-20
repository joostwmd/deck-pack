import type { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod";

import type { AppEnv } from "../types";

export function registerErrorHandlers(app: Hono<AppEnv>) {
  app.onError((err, c) => {
    const log = c.get("logger");

    if (err instanceof HTTPException) {
      log?.warn("HTTP error", { status: err.status, message: err.message });
      return err.getResponse();
    }

    if (err instanceof ZodError) {
      return c.json({ error: "Validation failed", issues: err.flatten() }, 400);
    }

    log?.error("Unhandled error", {
      message: err instanceof Error ? err.message : String(err),
    });
    return c.json({ error: "Internal Server Error" }, 500);
  });

  app.notFound((c) => c.json({ error: "Not Found", path: c.req.path }, 404));
}
