import type { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod";

import type { ErrorReporter } from "@deck-pack/observability/server";

import type { AppEnv } from "../types";

export function registerErrorHandlers(app: Hono<AppEnv>, errorReporter: ErrorReporter) {
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

    errorReporter.captureException(err, {
      requestId: c.get("requestId"),
      userId: c.get("user")?.id,
      tags: { path: c.req.path, method: c.req.method },
    });
    return c.json({ error: "Internal Server Error" }, 500);
  });

  app.notFound((c) => c.json({ error: "Not Found", path: c.req.path }, 404));
}
