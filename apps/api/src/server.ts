import { trpcServer } from "@hono/trpc-server";
import { serve } from "@hono/node-server";
import { Hono } from "hono";

import { auth } from "@deck-pack/auth/server";
import { env } from "@deck-pack/env/server";

import { createContext } from "./api/context";
import { appRouter } from "./api/router";
import { sessionMiddleware } from "./transport/auth-session";
import { registerErrorHandlers } from "./transport/error-handling";
import { registerHealthRoutes } from "./transport/health-checks";
import { requestContextMiddleware } from "./transport/request-context";
import { requestLoggingMiddleware } from "./transport/request-logging";
import { corsMiddleware, securityHeadersMiddleware } from "./transport/security";
import type { AppEnv } from "./types";

export function createApp() {
  const app = new Hono<AppEnv>();

  app.use("*", securityHeadersMiddleware);
  app.use("*", corsMiddleware);

  app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

  app.use("*", requestContextMiddleware);
  app.use("*", requestLoggingMiddleware);
  app.use("*", sessionMiddleware);

  app.use(
    "/trpc/*",
    trpcServer({
      router: appRouter,
      createContext: (_opts, c) => createContext({ context: c }),
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
