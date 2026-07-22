import { serve } from "@hono/node-server";
import { Hono } from "hono";

import { env } from "@deck-pack/env/server";
import {
  createErrorReporter,
  createRequestMonitoring,
  type ErrorReporter,
  type RequestMonitoring,
} from "@deck-pack/observability/server";

import { ApiAppBuilder } from "./app-builder";
import { createAppRouter, type AppRouter } from "./trpc/router";
import { AppContainer } from "./container";
import type { AppEnv } from "./types";

export type CreateAppOptions = {
  router?: AppRouter;
  container?: AppContainer;
  errorReporter?: ErrorReporter;
  monitoring?: RequestMonitoring;
};

export function createApp(options?: CreateAppOptions): Hono<AppEnv> {
  const container = options?.container ?? AppContainer.production();
  const appRouter = options?.router ?? createAppRouter(container.toRouterDeps(), container);
  const errorReporter =
    options?.errorReporter ??
    createErrorReporter({ dsn: env.SENTRY_DSN, environment: env.NODE_ENV });
  const monitoring =
    options?.monitoring ??
    createRequestMonitoring({ clientId: env.APITALLY_CLIENT_ID, env: env.APITALLY_ENV });

  return new ApiAppBuilder()
    .withCors()
    .withErrorReporter(errorReporter)
    .withMonitoring(monitoring)
    .withSecurityHeaders()
    .withAuthRoutes()
    .withRequestContext()
    .withSession()
    .withApitallyConsumer()
    .withContainer(container)
    .withTrpc(appRouter)
    .withHealth()
    .withErrorHandlers()
    .build();
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
