import { serve } from "@hono/node-server";
import { Hono } from "hono";

import { env } from "@deck-pack/env/server";

import { ApiAppBuilder } from "./app-builder";
import { createAppRouter, type AppRouter } from "./api/router";
import { AppContainer } from "./container";
import type { AppEnv } from "./types";

export type CreateAppOptions = {
  router?: AppRouter;
  container?: AppContainer;
};

export function createApp(options?: CreateAppOptions): Hono<AppEnv> {
  const container = options?.container ?? AppContainer.production();
  const appRouter = options?.router ?? createAppRouter(container.toRouterDeps());

  return new ApiAppBuilder()
    .withCors()
    .withMonitoring()
    .withSecurityHeaders()
    .withAuthRoutes()
    .withRequestContext()
    .withSession()
    .withApitallyConsumer()
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
