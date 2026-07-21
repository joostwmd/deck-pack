import { trpcServer } from "@hono/trpc-server";
import { TRPCError } from "@trpc/server";
import { getLogger } from "@logtape/logtape";
import { Hono } from "hono";

import { auth } from "@deck-pack/auth/server";

import { createContext } from "./api/context";
import type { Context } from "./api/context";
import type { AppRouter } from "./api/router";
import { initializeApitally } from "./lib/observability/apitally";
import { captureRequestError } from "./lib/observability/sentry";
import { apitallySessionConsumerMiddleware } from "./transport/apitally-consumer";
import { sessionMiddleware } from "./transport/auth-session";
import { registerErrorHandlers } from "./transport/error-handling";
import { registerHealthRoutes } from "./transport/health-checks";
import { requestContextMiddleware } from "./transport/request-context";
import { requestLoggingMiddleware } from "./transport/request-logging";
import {
  corsMiddleware,
  securityHeadersMiddleware,
  applyCorsToResponse,
} from "./transport/security";
import type { AppEnv } from "./types";

export class ApiAppBuilder {
  private readonly app = new Hono<AppEnv>();
  private router?: AppRouter;
  private corsEnabled = false;
  private monitoringEnabled = false;

  withCors(): this {
    this.app.use("*", corsMiddleware);
    this.corsEnabled = true;
    return this;
  }

  withMonitoring(): this {
    initializeApitally(this.app);
    this.monitoringEnabled = true;
    return this;
  }

  withSecurityHeaders(): this {
    this.app.use("*", securityHeadersMiddleware);
    return this;
  }

  withAuthRoutes(): this {
    this.app.on(["POST", "GET"], "/api/auth/*", async (c) => {
      const response = await auth.handler(c.req.raw);
      return applyCorsToResponse(c.req.header("Origin"), response);
    });
    return this;
  }

  withRequestContext(): this {
    this.app.use("*", requestContextMiddleware);
    this.app.use("*", requestLoggingMiddleware);
    return this;
  }

  withSession(): this {
    this.app.use("*", sessionMiddleware);
    return this;
  }

  withApitallyConsumer(): this {
    this.app.use("*", apitallySessionConsumerMiddleware);
    return this;
  }

  withTrpc(router: AppRouter): this {
    this.router = router;
    this.app.use(
      "/trpc/*",
      trpcServer({
        router,
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
    return this;
  }

  withHealth(): this {
    this.app.get("/", (c) => c.text("OK"));
    registerHealthRoutes(this.app);
    return this;
  }

  withErrorHandlers(): this {
    registerErrorHandlers(this.app);
    return this;
  }

  build(): Hono<AppEnv> {
    if (!this.router) {
      throw new Error("ApiAppBuilder requires a tRPC router. Call withTrpc() before build().");
    }
    return this.app;
  }

  /** @internal Test-only accessors for integration-test shape assertions. */
  testState(): { corsEnabled: boolean; monitoringEnabled: boolean } {
    return {
      corsEnabled: this.corsEnabled,
      monitoringEnabled: this.monitoringEnabled,
    };
  }
}
