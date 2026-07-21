# `packages/observability` — infra package, becoming isomorphic (browser + server)

Kind: **infra**. Currently browser-only; the backend hand-rolls its own Sentry/Apitally setup inline in `apps/api` instead of following the same package-owned-init pattern the frontend already uses. This doc adds a `server/` subpath that mirrors `browser/`'s existing shape.

## Current state (confirmed)

```
packages/observability/src/
  init.ts               — initBrowserSentry(options) — browser-only
  capture.ts
  app-error-boundary.tsx
  index.ts

apps/api/src/lib/observability/
  sentry.ts               — initSentry() — inline Sentry.init call, not going through this package
  apitally.ts              — initializeApitally(app) — inline useApitally call, not going through this package

apps/api/src/observability.ts   — initObservability() — LogTape config, separate again
```

`packages/observability/src/init.ts` in full (confirmed) — the frontend's model, already correct:

```typescript
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

  if (enabled) Sentry.getCurrentScope().setTag("app", app);
}
```

`apps/api/src/lib/observability/apitally.ts` in full (confirmed) — the backend's _inline_ equivalent, never routed through the shared package:

```typescript
export function initializeApitally(app: Hono<AppEnv>) {
  if (!env.APITALLY_CLIENT_ID) return;
  const registerApitally = useApitally as unknown as (
    honoApp: Hono<AppEnv>,
    config: Parameters<typeof useApitally>[1],
  ) => void;
  registerApitally(app, {
    clientId: env.APITALLY_CLIENT_ID,
    env: env.APITALLY_ENV,
    requestLogging: {
      enabled: true,
      logRequestHeaders: false,
      logRequestBody: false,
      logResponseHeaders: false,
      logResponseBody: false,
      captureLogs: true,
    },
  });
}
```

Note this file already no-ops cleanly without a client ID — the underlying instinct is fine, it's just not expressed as a swappable `RequestMonitoring`/`Noop` pair the way `00-conventions-and-architecture.md` §6.2/§6.3 describes, and it lives outside the package that's supposed to own all observability init.

## Target file tree

```
packages/observability/src/
  browser/
    init.ts                — initBrowserSentry (unchanged, moved from top-level init.ts)
    capture.ts               — unchanged
    app-error-boundary.tsx    — unchanged
    index.ts
  server/
    error-reporter.ts          — ErrorReporter interface + SentryErrorReporter + NoopErrorReporter + createErrorReporter factory
    request-monitoring.ts       — RequestMonitoring interface + ApitallyRequestMonitoring + NoopRequestMonitoring + createRequestMonitoring factory
    logging.ts                   — initLogging() — LogTape config, moved from apps/api/src/observability.ts
    index.ts
  index.ts                       — re-exports both subpaths; apps import from the specific subpath (@deck-pack/observability/browser or /server) to avoid bundling server code into browser builds
```

## Target code — two separate interfaces (§6.3), not one merged `MonitoringPort`

```typescript
// server/error-reporter.ts
export interface ErrorReporter {
  captureException(error: unknown, context?: Record<string, unknown>): void;
}

export class SentryErrorReporter implements ErrorReporter {
  constructor(options: { dsn: string; environment: string }) {
    Sentry.init({
      dsn: options.dsn,
      environment: options.environment,
      tracesSampleRate: options.environment === "production" ? 0.1 : 1.0,
    });
  }
  captureException(error: unknown, context?: Record<string, unknown>): void {
    Sentry.captureException(error, { extra: context });
  }
}

export class NoopErrorReporter implements ErrorReporter {
  captureException(): void {}
}

export function createErrorReporter(options: {
  dsn: string | undefined;
  environment: string;
}): ErrorReporter {
  if (!options.dsn) return new NoopErrorReporter();
  return new SentryErrorReporter({ dsn: options.dsn, environment: options.environment });
}
```

```typescript
// server/request-monitoring.ts
export interface RequestMonitoring {
  register(app: Hono<AppEnv>): void;
}

export class ApitallyRequestMonitoring implements RequestMonitoring {
  constructor(private readonly options: { clientId: string; env: string }) {}

  register(app: Hono<AppEnv>): void {
    const registerApitally = useApitally as unknown as (
      honoApp: Hono<AppEnv>,
      config: Parameters<typeof useApitally>[1],
    ) => void;
    registerApitally(app, {
      clientId: this.options.clientId,
      env: this.options.env,
      requestLogging: {
        enabled: true,
        logRequestHeaders: false,
        logRequestBody: false,
        logResponseHeaders: false,
        logResponseBody: false,
        captureLogs: true,
      },
    });
  }
}

export class NoopRequestMonitoring implements RequestMonitoring {
  register(): void {}
}

export function createRequestMonitoring(options: {
  clientId: string | undefined;
  env: string;
}): RequestMonitoring {
  if (!options.clientId) return new NoopRequestMonitoring();
  return new ApitallyRequestMonitoring({ clientId: options.clientId, env: options.env });
}
```

Call site in `apps/api/src/index.ts`, before/after:

```typescript
// Before — the decision is an inline ternary-shaped no-op guard buried in initializeApitally()
initSentry();
await initObservability();
// ... and initializeApitally(app) called separately, later, inside server.ts

// After — every monitoring concern is constructed once, at the same place, the same way
const errorReporter = createErrorReporter({ dsn: env.SENTRY_DSN, environment: env.NODE_ENV });
const monitoring = createRequestMonitoring({
  clientId: env.APITALLY_CLIENT_ID,
  env: env.APITALLY_ENV,
});
initLogging();
```

`monitoring` then flows into `new ApiAppBuilder().withMonitoring(monitoring)...` (`apps/api.md` §6.1); `errorReporter` is injected wherever `apps/api` currently would `Sentry.captureException` directly (e.g. inside `error-mapping.ts`, for errors that get reported but still return a clean `TRPCError` to the client).

## What stays in `apps/api/src/transport/apitally-consumer.ts`, and why

`apitally-consumer.ts` reads this app's specific session/organization/role shape to label Apitally consumers for per-tenant dashboards. That's domain-aware glue — it has to know what a deck-pack session looks like — so it correctly stays in `apps/api/src/transport/`, not in `packages/observability`. The package owns _generic_ "how do I wire Apitally/Sentry into any Hono app," the app owns _specific_ "how do I map deck-pack's session shape onto Apitally's consumer concept." This is the same infra-vs-app-specific-glue split described for the `transport/` layer in `apps/api.md`.

## Design patterns implemented here, and what each solves

| Pattern                         | File(s)                                                   | Problem solved                                                                                                                                                                                                                                                 |
| ------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Interface Segregation**       | `ErrorReporter` vs. `RequestMonitoring` as two interfaces | Sentry (call from anywhere) and Apitally (register once on `app`) have genuinely different shapes; forcing one `MonitoringPort` would give every consumer methods it doesn't call                                                                              |
| **Strategy + Factory function** | `createErrorReporter`, `createRequestMonitoring`          | "Real implementation or Noop" is decided once, in a testable function, not as an inline ternary at the call site — the exact concern raised when reviewing `const monitoring = env.APITALLY_CLIENT_ID ? new Apitally... : new Noop...` at the composition root |
| **Noop object**                 | `NoopErrorReporter`, `NoopRequestMonitoring`              | Tests and local dev without credentials get a real, inert implementation instead of an `if (monitoring) monitoring.foo()` null-check scattered at every call site                                                                                              |

## Migration order

1. Move `init.ts`/`capture.ts`/`app-error-boundary.tsx` into `browser/`, update `index.ts`'s re-export path — pure move, update the two frontend apps' import paths (`@deck-pack/observability` → `@deck-pack/observability/browser`).
2. Write `server/error-reporter.ts` and `server/request-monitoring.ts` per the target code above, porting the exact Sentry/Apitally calls from `apps/api/src/lib/observability/*.ts`.
3. Move `apps/api/src/observability.ts`'s LogTape config into `server/logging.ts`.
4. Update `apps/api/src/index.ts` to call `createErrorReporter`/`createRequestMonitoring`/`initLogging` from the package.
5. Delete `apps/api/src/lib/observability/` and `apps/api/src/observability.ts`.
6. Wire `monitoring` into `ApiAppBuilder.withMonitoring()` per `apps/api.md`.
