# `apps/api` — detailed refactor plan

Reference: `00-conventions-and-architecture.md` §3.3, §6.1, §9.3. This app becomes the thinnest layer in the whole system — its only job is translating HTTP/tRPC into use-case calls and back.

## Current state (for reference during migration)

```
apps/api/src/
  types.ts, observability.ts, index.ts, server.ts
  api/  (context.ts, discovery-context.ts, procedures.ts, router.ts, setup.ts, guards/, resilience/)
  lib/  (observability/apitally.ts, observability/sentry.ts, strings.ts)
  transport/ (apitally-consumer.ts, auth-session.ts, error-handling.ts, health-checks.ts, request-context.ts, request-logging.ts, security.ts)
  domains/ (addin, agenda, assets, billing, brand-profiles, flags, icons, library, logos, members, organization, photos, seats, shapes, shortcuts, slides, system, users)
```

`domains/*` currently mixes `routes.ts` + `service.ts` + `schemas.ts` (+ occasionally `org-service.ts`, `org-routes.ts`, `mappers.ts`, `signed-urls.ts`) in one folder per domain — this is the vertical slice we're pulling apart.

## Target file tree

```
apps/api/src/
  index.ts
  server.ts
  container.ts
  types.ts
  trpc/                          — RENAMED from `api/`; see §"Cleaning up trpc/ (was api/)" below for the full rationale
    context.ts                   — discovery-context.ts's one helper folded in as a named export
    procedures.ts
    router.ts
    init.ts                      — RENAMED from `setup.ts`
    error-mapping.ts             — PROMOTED from `api/resilience/error-mapping.ts`; `resilience/` folder removed
    guards/
      middleware/                — Context-shaped, `.use()`-able directly
        require-authenticated-session.ts
        require-organization-membership.ts
        require-platform-admin.ts
        require-permission.ts
        require-team-workspace.ts
        require-solo-workspace.ts
        require-active-seat.ts
      assertions/                — plain functions, called manually, NOT middleware
        require-active-organization-id.ts
        require-team-organization-by-id.ts
        require-solo-organization-by-id.ts
        has-permission.ts
  routers/
    organization-router.ts
    gallery-router.ts
    members-router.ts
    seats-router.ts
    billing-router.ts
    logos-router.ts
    photos-router.ts
    icons-router.ts
    users-router.ts
    ...
  transport/
    apitally-consumer.ts
    auth-session.ts
    http-error-handler.ts        — RENAMED from `error-handling.ts`
    health-checks.ts
    request-context.ts
    request-logging.ts
    security.ts
  utils/
    strings.ts
```

## What each file contains

| File                              | Contents                                                                                                                                                                                                                                                                                                                                     |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `index.ts`                        | Process entrypoint. Calls `createErrorReporter`, `createRequestMonitoring`, `initLogging` (all from `@deck-pack/observability/server`), then dynamically imports and calls `startServer()`. No business logic, no Hono knowledge.                                                                                                            |
| `server.ts`                       | `createApp(options?)` builds an `ApiAppBuilder`, adds steps (`.withCors()`, `.withSecurityHeaders()`, `.withMonitoring(monitoring)`), calls `.withRouter(createAppRouter(container))`, `.build()`. `startServer()` calls `serve()`.                                                                                                          |
| `container.ts`                    | `AppContainer` class + its three static factories (`production`, `forIntegrationTest`, `forUnitTest`) — see `00-conventions-and-architecture.md` §9.3 for the full listing. This file grows by one constructor field per migrated domain.                                                                                                    |
| `trpc/init.ts`                    | `initTRPC.context<Context>().create(...)` — exports `t`, `router`, `middleware`. Nothing else; the name says exactly what it does (tRPC bootstrap), unlike the old generic `setup.ts`.                                                                                                                                                       |
| `trpc/context.ts`                 | `Context` type + `createContext()`, plus the one context-derived helper (`activeOrganizationIdFromSession`) that used to be its own file (`discovery-context.ts`) for no reason.                                                                                                                                                             |
| `trpc/router.ts`                  | Composes every `*-router.ts` from `routers/` into one `AppRouter`, taking `AppContainer` as its only parameter.                                                                                                                                                                                                                              |
| `trpc/error-mapping.ts`           | The one file that knows both `AppError` subclasses and `TRPCError` codes exist — middleware that converts one to the other. Use-cases never import tRPC. Promoted out of a now-deleted `resilience/` subfolder (see below) since it's the only survivor.                                                                                     |
| `trpc/guards/middleware/*`        | One file per tRPC guard, each exporting a `Context`-shaped `middleware<Context>(...)`, directly `.use()`-able onto a procedure. Named `require<Thing>` — never `is<Thing>`, since every guard throws rather than returning a boolean.                                                                                                        |
| `trpc/guards/assertions/*`        | Plain async functions taking raw values (`tx`, `headers`, an id) instead of `Context` — called manually inside a use-case or a `middleware/*` file, never `.use()`'d directly. Kept in a separate subfolder specifically so a reader can tell the calling shape from the folder alone.                                                       |
| `routers/organization-router.ts`  | tRPC procedures only — input schema, call a use-case, return. No Drizzle, no business rule, ever.                                                                                                                                                                                                                                            |
| `transport/apitally-consumer.ts`  | Stays here (not in the observability package) — it reads this app's specific session/org/role shape to label Apitally consumers, which is domain-aware glue, not generic monitoring setup.                                                                                                                                                   |
| `transport/http-error-handler.ts` | Hono's raw `app.onError`/`app.notFound` handlers for anything outside tRPC. Renamed from `error-handling.ts` to pair by name with `trpc/error-mapping.ts` — these are the HTTP-layer and tRPC-layer versions of the same "map a thrown error to a response" concern, and the names now say so instead of looking like accidental duplicates. |
| `utils/strings.ts`                | Generic string helpers — the only survivor of the old `lib/` grab-bag.                                                                                                                                                                                                                                                                       |

## Cleaning up `trpc/` (was `api/`)

The router and container got a clear redesign already (§9.3); the rest of the old `api/` folder — `guards/`, `resilience/`, `discovery-context.ts`, `setup.ts` — carried over the current codebase's shape almost unchanged, which is why it still reads as messy. Three concrete problems, and the fix for each:

**1. Guards mixed two calling shapes with no naming signal.** The current `guards/` folder has five files, but they aren't five variations on one theme — some export ready-to-`.use()` tRPC middleware (`isAuthenticated`, `isOrganizationMember`, `isPlatformAdmin`, `requireTeamWorkspace`, `requireSoloWorkspace`), others export plain functions taking raw values (`requireActiveOrganizationId(ctx)`, `assertActiveSeat(tx, input)`, `hasPermission(headers, permissions)`, `assertTeamOrganizationById(tx, id)`). Nothing in the file listing tells you which is which. Fix: split into `guards/middleware/` and `guards/assertions/` — the folder itself now encodes the calling shape.

The current `authorization.ts` also bundles three unrelated checks (org-membership DB query, platform-admin DB query, Better Auth RBAC permission check) in one file, and `org-type.ts` mixes current middleware with a `@deprecated` alias and two tx-shaped helpers. Both get split one-guard-per-file along the same `middleware/` vs `assertions/` line, and `requireTeamOrganization` (the deprecated alias) is deleted rather than carried forward.

**2. `isAuthenticated`/`isOrganizationMember`/`isPlatformAdmin` read like boolean predicates but throw.** None of them return `true`/`false` — every guard either passes through or throws a `TRPCError`. Renamed to `require<Thing>` uniformly (`requireAuthenticatedSession`, `requireOrganizationMembership`, `requirePlatformAdmin`, ...) so the verb itself tells you it's an assertion, not a check.

**3. `active-seat.ts`'s `assertActiveSeat(tx, input)` couldn't be `.use()`'d like its siblings.** Because it takes `(tx, input)` instead of `Context`, `procedures.ts` has to hand-wrap it in a bespoke inline `middleware(async ({ ctx, next }) => { ...await assertActiveSeat(ctx.tx, {...}); return next({ctx}); })` — the strongest single piece of evidence that this guard wasn't written in the same shape as the rest. `require-active-seat.ts` is rewritten to read `ctx.session`/`ctx.tx` itself, so `addinLicensedProcedure` becomes a plain `.use(requireActiveSeat)` like every other guard:

```typescript
// trpc/guards/middleware/require-active-seat.ts
import { middleware } from "../../init";
import type { Context } from "../../context";
import { requireActiveOrganizationId } from "../assertions/require-active-organization-id";
import { assertHasActiveSeat } from "@deck-pack/db/queries/activateOrganizationSeat";

/** Requires the caller to hold an active add-in seat in the current organization. */
export const requireActiveSeat = middleware<Context>(async ({ ctx, next }) => {
  const organizationId = requireActiveOrganizationId(ctx);
  await assertHasActiveSeat(ctx.tx, { organizationId, userId: ctx.session!.user.id });
  return next({ ctx });
});
```

```typescript
// procedures.ts — after
export const addinLicensedProcedure = organizationMemberProcedure
  .use(requirePermission({ asset: ["insert"] }))
  .use(requireActiveSeat); // no more inline middleware(...) wrapping at the call site
```

## Example: `routers/organization-router.ts`

```typescript
import { protectedProcedure, router } from "../api/procedures";
import { createOrganizationInput, organizationIdInput } from "@deck-pack/organization/schemas";
import { CreateOrganization, ListOrganizations } from "@deck-pack/organization";
import type { AppContainer } from "../container";

export function organizationRouter(container: AppContainer) {
  return router({
    create: protectedProcedure
      .input(createOrganizationInput)
      .mutation(({ input, ctx }) =>
        new CreateOrganization(container.organizationRepository).execute(input, ctx.user),
      ),

    list: protectedProcedure.query(({ ctx }) =>
      new ListOrganizations(container.organizationRepository).execute(ctx.user),
    ),
  });
}
```

## Example: `server.ts` with the Builder pattern

```typescript
export function createApp(options?: CreateAppOptions): Hono<AppEnv> {
  const container = options?.container ?? AppContainer.production();
  const monitoring =
    options?.monitoring ??
    createRequestMonitoring({
      clientId: env.APITALLY_CLIENT_ID,
      env: env.APITALLY_ENV,
    });

  return new ApiAppBuilder()
    .withCors()
    .withSecurityHeaders()
    .withMonitoring(monitoring)
    .withRouter(createAppRouter(container))
    .build();
}

export function startServer(): void {
  const app = createApp();
  serve({ fetch: app.fetch, port: env.PORT }, (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  });
}
```

## Design patterns implemented here, and what each solves

| Pattern                                     | File(s)                                                            | Problem solved                                                                                                                                                                               |
| ------------------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Builder**                                 | `server.ts` (`ApiAppBuilder`)                                      | Named, independently-omittable app-assembly steps — lets tests build an app without monitoring/CORS wired in, instead of forking `createApp`                                                 |
| **Dependency Injection (composition root)** | `container.ts` (`AppContainer`)                                    | Single seam for swapping every repository/port between production, integration-test, and unit-test implementations                                                                           |
| **Adapter (thin)**                          | every `routers/*.ts`                                               | Translates tRPC's input/output shape to a use-case's `execute()` call; contains zero business logic itself                                                                                   |
| **Chain of Responsibility**                 | `trpc/procedures.ts`, `trpc/guards/middleware/*`                   | tRPC middleware chain for auth/org-context/seat checks — every link is now uniformly `Context`-shaped, so the chain composes with plain `.use()` and never needs call-site-specific wrapping |
| **Strategy (via factory)**                  | `index.ts` calling `createErrorReporter`/`createRequestMonitoring` | Picks the Sentry/Apitally-backed implementation or a no-op based on env config, decision owned by one function each                                                                          |

## Migration order for this app

1. Rename `api/` → `trpc/`, `setup.ts` → `init.ts`. Fold `discovery-context.ts` into `context.ts`. Promote `resilience/error-mapping.ts` to `trpc/error-mapping.ts`; delete `resilience/service-result.ts` once its call sites are confirmed migrated to `AppError`, then delete the empty `resilience/` folder. Rename `transport/error-handling.ts` → `transport/http-error-handler.ts`. This step is a pure rename/move — no behavior change — so it's safe to do first and land as its own small commit.
2. Split `trpc/guards/` into `middleware/` and `assertions/`, renaming every export to `require<Thing>`: `authentication.ts` → `middleware/require-authenticated-session.ts`; `authorization.ts` splits three ways into `middleware/require-organization-membership.ts`, `middleware/require-platform-admin.ts`, `middleware/require-permission.ts` + `assertions/has-permission.ts`; `org-context.ts` → `assertions/require-active-organization-id.ts`; `org-type.ts` splits into `middleware/require-team-workspace.ts`, `middleware/require-solo-workspace.ts`, `assertions/require-team-organization-by-id.ts`, `assertions/require-solo-organization-by-id.ts` (drop the `@deprecated requireTeamOrganization` alias, updating its 1-2 call sites directly). Rewrite `active-seat.ts` as `middleware/require-active-seat.ts` (`Context`-shaped), and simplify `procedures.ts`'s `addinLicensedProcedure` to a plain `.use(requireActiveSeat)`. Re-run the full test suite — this step touches every guard, so it's the one place to double-check nothing was renamed inconsistently between its export and its call sites.
3. Extract one domain (`organization` — simplest, no Saga, no file storage) into `packages/organization` first. Wire its router. Confirm tests pass.
4. Introduce `AppContainer` with just the organization fields; keep every other domain on the old `deps` object passed into `createAppRouter` until migrated.
5. Introduce `ApiAppBuilder`, migrate `createApp` to use it, confirm identical runtime behavior (CORS/Apitally/etc. still fire in the same order).
6. Move `apps/api/src/lib/observability/*` into `packages/observability/src/server/*`, update `index.ts` and `server.ts` imports.
7. Repeat step 3 per remaining domain, in order of complexity: `members`, `seats`, `billing` (introduces Saga — see `packages/gallery.md` for the pattern), `logos`/`photos`/`icons` (introduces integration ports), `gallery` (Saga + integration port + DB rename, do last since it's the most invasive).
8. Delete `apps/api/src/domains/` once every domain has moved.
