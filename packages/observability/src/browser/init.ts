import * as Sentry from "@sentry/react";

export type BrowserApp = "portal" | "ops" | "addin";

export type InitBrowserSentryOptions = {
  dsn?: string;
  environment: string;
  app: BrowserApp;
  tracePropagationTargets: (string | RegExp)[];
};

export function initBrowserSentry(options: InitBrowserSentryOptions): void {
  const { dsn, environment, app, tracePropagationTargets } = options;
  const enabled = Boolean(dsn);

  Sentry.init({
    dsn,
    enabled,
    environment,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: environment === "production" ? 0.1 : 1.0,
    tracePropagationTargets,
  });

  if (enabled) {
    Sentry.getCurrentScope().setTag("app", app);
  }
}
