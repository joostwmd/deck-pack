import * as Sentry from "@sentry/node";

import { env } from "@deck-pack/env/server";

export function initSentry() {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    enabled: Boolean(env.SENTRY_DSN),
    tracesSampleRate: env.NODE_ENV === "production" ? 0.1 : 1.0,
  });
}

export type CaptureRequestErrorContext = {
  requestId?: string | null;
  userId?: string | null;
  tags?: Record<string, string>;
};

/** Send to Sentry when enabled; no-ops without DSN. */
export function captureRequestError(error: unknown, ctx: CaptureRequestErrorContext) {
  if (!env.SENTRY_DSN) return;

  Sentry.withScope((scope) => {
    if (ctx.requestId) {
      scope.setTag("requestId", ctx.requestId);
    }
    if (ctx.tags) {
      for (const [k, v] of Object.entries(ctx.tags)) {
        scope.setTag(k, v);
      }
    }
    if (ctx.userId) {
      scope.setUser({ id: ctx.userId });
    }
    Sentry.captureException(error);
  });
}
