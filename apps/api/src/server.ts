import { trpcServer } from "@hono/trpc-server";
import { serve } from "@hono/node-server";
import { TRPCError } from "@trpc/server";
import { getLogger } from "@logtape/logtape";
import { Hono } from "hono";
import { validator } from "hono/validator";
import { z } from "zod";

import { appAuth, opsAuth } from "@deck-pack/auth/server";
import { env } from "@deck-pack/env/server";
import { BrandfetchClient } from "@deck-pack/brandfetch";

import { createContext } from "./api/context";
import type { Context } from "./api/context";
import { appRouter } from "./api/router";
import { initializeApitally } from "./lib/observability/apitally";
import { captureRequestError } from "./lib/observability/sentry";
import { apitallySessionConsumerMiddleware } from "./transport/apitally-consumer";
import { sessionMiddleware } from "./transport/auth-session";
import { registerErrorHandlers } from "./transport/error-handling";
import { registerHealthRoutes } from "./transport/health-checks";
import { requestContextMiddleware } from "./transport/request-context";
import { requestLoggingMiddleware } from "./transport/request-logging";
import { corsMiddleware, securityHeadersMiddleware } from "./transport/security";
import type { AppEnv } from "./types";

export function createApp() {
  const app = new Hono<AppEnv>();

  // TODO: Add proper Brandfetch API key from environment
  const brandfetch = new BrandfetchClient("dummy-key-for-now");

  // Custom CORS middleware (works reliably)
  app.use("*", corsMiddleware);

  initializeApitally(app);

  app.use("*", securityHeadersMiddleware);

  app.on(["POST", "GET"], "/api/auth/ops/*", (c) => opsAuth.handler(c.req.raw));
  app.on(["POST", "GET"], "/api/auth/app/*", (c) => appAuth.handler(c.req.raw));

  app.use("*", requestContextMiddleware);
  app.use("*", requestLoggingMiddleware);
  app.use("*", sessionMiddleware);
  /** When `/api/machine` exists, mount machine auth + Apitally consumer on that sub-app only. */
  app.use("*", apitallySessionConsumerMiddleware);

  app.use(
    "/trpc/*",
    trpcServer({
      router: appRouter,
      createContext: (_opts, c) => createContext({ context: c }),
      onError: ({ error, path, type, ctx }) => {
        const trpcLogger = getLogger(["deck-pack", "api", "trpc"]);
        const cctx = ctx as Context | undefined;
        trpcLogger.error("tRPC error", {
          path,
          type,
          code: error.code,
          message: error.message,
          requestId: cctx?.requestId,
        });

        if (
          error instanceof TRPCError &&
          (error.code === "INTERNAL_SERVER_ERROR" || error.code === "TIMEOUT")
        ) {
          captureRequestError(error.cause ?? error, {
            requestId: cctx?.requestId,
            userId: cctx?.user?.id,
            tags: {
              trpcPath: path ?? "",
              trpcType: String(type),
            },
          });
        }
      },
    }),
  );

  app.get("/", (c) => c.text("OK"));

  // Logo API endpoints
  app.post(
    "/api/logos/search",
    validator("json", (value, c) => {
      const parsed = z
        .object({
          query: z.string().min(1).max(100),
        })
        .safeParse(value);

      if (!parsed.success) {
        return c.json({ error: "Invalid request body" }, 400);
      }

      return parsed.data;
    }),
    async (c) => {
      try {
        const { query } = c.req.valid("json");
        const response = await brandfetch.searchBrands({ query });
        return c.json(response);
      } catch (error) {
        console.error("Logo search error:", error);
        return c.json({ error: "Failed to search logos" }, 500);
      }
    },
  );

  app.post(
    "/api/logos/get",
    validator("json", (value, c) => {
      const parsed = z
        .object({
          brandId: z.string().min(1),
        })
        .safeParse(value);

      if (!parsed.success) {
        return c.json({ error: "Invalid request body" }, 400);
      }

      return parsed.data;
    }),
    async (c) => {
      try {
        const { brandId } = c.req.valid("json");
        const response = await brandfetch.getBrandDetails({ brandId });
        return c.json(response);
      } catch (error) {
        console.error("Logo details error:", error);
        return c.json({ error: "Failed to get logo details" }, 500);
      }
    },
  );

  registerHealthRoutes(app);
  registerErrorHandlers(app);

  return app;
}

export function startServer() {
  const app = createApp();
  serve(
    {
      fetch: app.fetch,
      port: env.PORT,
    },
    (info) => {
      console.log(`Server is running on http://localhost:${info.port}`);
    },
  );
}
