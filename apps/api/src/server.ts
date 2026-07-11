import { trpcServer } from "@hono/trpc-server";
import { serve } from "@hono/node-server";
import { TRPCError } from "@trpc/server";
import { getLogger } from "@logtape/logtape";
import { Hono } from "hono";

import { appAuth, opsAuth } from "@deck-pack/auth/server";
import { env } from "@deck-pack/env/server";

import { createContext } from "./api/context";
import type { Context } from "./api/context";
import { createAppRouter } from "./api/router";
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

  const appRouter = createAppRouter({
    brandfetchApiKey: "dummy-key-for-now",
    icons8ApiKey: "dummy-key-for-now",
    pexelsApiKey: env.PEXELS_API_KEY,
  });

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
