# Target Structure

The full destination tree, plus an old → new mapping for everything that moves or gets renamed. Read `00-conventions-and-architecture.md` first — this file is "where," that file is "why."

No change is needed to `pnpm-workspace.yaml` — it already globs `packages/*`, so every new domain package is picked up automatically.

---

## 1. `apps/api` — target tree

```
apps/api/src/
  index.ts                    — process entrypoint: createErrorReporter, createRequestMonitoring, initLogging, start server
  server.ts                   — ApiAppBuilder assembly (see 00-conventions §6.1)
  container.ts                — AppContainer.production() wiring (see 00-conventions §9.3)
  types.ts                    — AppEnv (Hono generic env)
  trpc/                        — RENAMED from `api/` — "api inside the api app" was redundant; named after the technology it wraps, matching `transport/` below (see 00-conventions §12 for the guard-naming rules)
    init.ts                     — RENAMED from `setup.ts`: t, router, middleware (tRPC bootstrap only — name says exactly what it inits)
    context.ts                  — createContext + Context type; discovery-context.ts's one helper folded in as a named export here (activeOrganizationIdFromSession)
    procedures.ts                — unchanged role, but every guard it composes is now uniformly Context-shaped — no more inline ad-hoc middleware wrapping for active-seat
    error-mapping.ts              — PROMOTED from `api/resilience/error-mapping.ts`; AppError -> TRPCError mapping. `resilience/` folder removed once `service-result.ts` is deleted (legacy ServiceResult call sites migrated to AppError)
    router.ts                     — composes all per-domain routers
    guards/
      middleware/                 — Context-shaped, always `.use()`-able directly onto a procedure
        require-authenticated-session.ts    — was `authentication.ts`'s isAuthenticated
        require-organization-membership.ts   — was `authorization.ts`'s isOrganizationMember
        require-platform-admin.ts             — was `authorization.ts`'s isPlatformAdmin
        require-permission.ts                  — was `authorization.ts`'s requirePermission factory (Better Auth RBAC)
        require-team-workspace.ts               — was `org-type.ts`'s requireTeamWorkspace
        require-solo-workspace.ts                — was `org-type.ts`'s requireSoloWorkspace
        require-active-seat.ts                    — REWRITTEN to read ctx.session/ctx.tx itself (was `active-seat.ts`'s assertActiveSeat, previously tx-shaped and hand-wrapped inline in procedures.ts)
      assertions/                  — plain functions, take raw values, called manually — NOT middleware, deliberately kept out of middleware/ so the split is visible from the folder alone
        require-active-organization-id.ts       — was `org-context.ts`'s requireActiveOrganizationId
        require-team-organization-by-id.ts        — was `org-type.ts`'s assertTeamOrganizationById
        require-solo-organization-by-id.ts         — was `org-type.ts`'s assertSoloOrganizationById
        has-permission.ts                           — was `authorization.ts`'s hasPermission helper
        # NOTE: org-type.ts's `@deprecated requireTeamOrganization` alias is deleted outright, not carried forward — update its call sites in the same change
  routers/
    organization-router.ts     — one per domain, thin: input schema + use-case call
    gallery-router.ts
    members-router.ts
    seats-router.ts
    billing-router.ts
    logos-router.ts
    photos-router.ts
    icons-router.ts
    users-router.ts
    ... one per remaining domain, see mapping table in §4
  transport/
    apitally-consumer.ts        — stays: app-specific session→consumer mapping (see 00-conventions §4.3 rationale)
    auth-session.ts
    http-error-handler.ts       — RENAMED from `error-handling.ts` — pairs by name with `trpc/error-mapping.ts` to signal these are the HTTP-layer and tRPC-layer versions of the same concern, not accidental duplicates
    health-checks.ts
    request-context.ts
    request-logging.ts
    security.ts
  utils/                        — renamed from `lib/`; generic helpers only (e.g. strings.ts). Monitoring code no longer lives here — moved to @deck-pack/observability/server.
```

## 2. `apps/portal`, `apps/ops` — target tree (identical shape)

```
apps/<portal|ops>/src/
  main.tsx                    — initBrowserSentry, build TanStack Router, mount React
  routes/                     — file-based routes, thin
  pages/                      — route-level, multi-domain compositions (dashboard, account, org-dashboard)
  domains/
    organization/
      organization-panel.tsx   — data-wiring + app-specific permission checks only; view + hook come from packages
    gallery/
      gallery-list-panel.tsx
      gallery-detail-panel.tsx
    members/
      members-panel.tsx
    ... one per domain actually used by this app
  services/
    app-services.ts             — DI container: constructs Store implementations from packages/hooks, injects the app's trpc client
    services-context.tsx
  local/                        — the one escape hatch (00-conventions §5)
  config/
  utils/
  auth/                          — portal-only today (require-permission.ts, use-can.ts) — evaluate whether this becomes a domain or stays app-local per app
```

## 3. `apps/addins/assets` — target tree

Office add-in frontend. Same shape as portal/ops where it has app-level domains, but consumes `@deck-pack/office-js` directly for anything Office.js-specific (no Store/hook wrapping needed for on-canvas operations, since those aren't backend-fetched data).

```
apps/addins/assets/src/
  main.tsx                     — initBrowserSentry app: "addin"
  routes/ or taskpane entry
  domains/                      — any backend-data domains this add-in uses (e.g. gallery, brand-compliance results)
  local/
```

## 4. `packages/` — target tree

```
packages/
  # domain packages (NEW — one per bounded context, package-per-domain per 00-conventions §3)
  organization/
  gallery/                     — renamed from `library`; see packages/gallery.md for the full rename + migration
  members/
  seats/
  billing/
  logos/
  photos/
  icons/
  users/
  brand-profiles/
  assets/
  flags/
  shapes/
  slides/
  system/
  addin/
  agenda-service/              — RENAMED from the backend `agenda` domain to avoid collision with packages/agenda (pure logic below); see §5 open question
  shortcut-overrides/          — RENAMED from the backend `shortcuts` domain to avoid collision with packages/shortcuts (pure logic below); see §5 open question

  # adapter packages (wrap one external system behind a port)
  storage/                     — ObjectStorage port; AzureObjectStorage / InMemoryObjectStorage classes (renamed from create* factories)
  integrations/                — raw SDK wrappers only: BrandfetchClient, PexelsClient, NounProjectClient (Icons8Client removed — see packages/integrations.md)
  office-js/                   — capability-oriented adapter package (agenda/, format/, selection/, snapshot/, fixes/, ...), OfficeClient class

  # infra packages (framework/tooling glue, no business logic)
  db/
  auth/
  env/
  config/
  observability/
    src/
      browser/                 — initBrowserSentry, capture, AppErrorBoundary (unchanged)
      server/                  — NEW: createErrorReporter, createRequestMonitoring, ApitallyRequestMonitoring, SentryErrorReporter, Noop* fakes, init-logging
  trpc-client/

  # ui-shared (design-system + centralized hooks; supersedes the old library-admin feature-slice model)
  ui/
    src/components/system/       — unchanged
    src/components/composite/    — unchanged
    src/components/organization/  — NEW: cross-app views, one folder per domain
    src/components/gallery/       — migrated from packages/library-admin + apps/{portal,ops}/features/{library-gallery,gallery}
    src/hooks/                    — unchanged: framework-utility hooks only (use-mobile, use-lazy-ref) — NOT business hooks
  hooks/                         — NEW package: all business/data-fetching hooks + their Store implementations
    src/organization/
      organization-store.ts
      use-organizations.ts
      query-keys.ts
    src/gallery/
      gallery-store.ts
      use-gallery-items.ts
      query-keys.ts
    ...

  # pure-logic / domain-kind packages (unchanged in shape, already correct)
  agenda/                       — pure reconciliation logic (unchanged; disambiguated from the new agenda-service domain package)
  shortcuts/                    — pure keybinding resolver (unchanged; disambiguated from the new shortcut-overrides domain package)
  presentation-check/ -> RENAMED to brand-compliance/    — see packages/brand-compliance.md
  presentation-formatting/ -> RENAMED to shape-commands/  — see packages/shape-commands.md

  # superseded — contents redistributed, package removed
  library-admin/  →  merged into ui/src/components/gallery/ + hooks/src/gallery/
```

---

## 5. Open naming collisions to resolve before implementing

Two backend domains share an English word with an existing pure-logic package. This wasn't fully resolved during the architecture discussion (those domains weren't inspected in depth) — flagging explicitly rather than guessing:

| Word      | Existing pure package                                         | Backend domain (DB-backed)                                                                                                    | Proposed disambiguation                                                                                                                           |
| --------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| agenda    | `packages/agenda` — reconciliation/update-plan logic, no DB   | `apps/api/src/domains/agenda` — persists agenda instances (`getAgendaInstance`, `syncAgenda` queries)                         | New domain package name: `packages/agenda-service` (or `packages/agenda-sync`) — **verify actual responsibility of the domain before finalizing** |
| shortcuts | `packages/shortcuts` — keybinding definitions/resolver, no DB | `apps/api/src/domains/shortcuts` — persists user shortcut overrides (`upsertShortcutOverride`, `listShortcutOverridesByUser`) | New domain package name: `packages/shortcut-overrides` — **verify actual responsibility of the domain before finalizing**                         |

---

## 6. Old → new mapping table (packages)

| Old                                                                    | New                                                                                                                                                                   | Reason                                                                                                                                                                                                                                                                                         |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/presentation-check`                                          | `packages/brand-compliance`                                                                                                                                           | Reuses the existing `brand-profiles` domain noun instead of a generic "presentation-" prefix; disambiguates from shape-commands                                                                                                                                                                |
| `packages/presentation-formatting`                                     | `packages/shape-commands`                                                                                                                                             | "Formatting" undersold that most commands are geometry, and overlapped conceptually with brand-compliance's typography checks                                                                                                                                                                  |
| `packages/storage` adapters                                            | unchanged package, classes renamed: `createAzureObjectStorage()` → `class AzureObjectStorage`, `createMemoryObjectStorage()` → `class InMemoryObjectStorage`          | 100% naming symmetry with Repository classes                                                                                                                                                                                                                                                   |
| `packages/library-admin`                                               | removed; contents redistributed into `packages/ui/src/components/gallery/` and `packages/hooks/src/gallery/`                                                          | Superseded by the "one central place for hooks/UI" rule (00-conventions §5)                                                                                                                                                                                                                    |
| `apps/api/src/lib/observability/*`                                     | `packages/observability/src/server/*`                                                                                                                                 | Backend monitoring now follows the same package-owned-init pattern the frontend already had                                                                                                                                                                                                    |
| `apps/api/src/lib/strings.ts`                                          | `apps/api/src/utils/strings.ts`                                                                                                                                       | `lib/` was a grab-bag; renamed to match `utils/` convention already used by portal/ops                                                                                                                                                                                                         |
| `apps/api/src/domains/*` (business logic)                              | `packages/<domain>/*`                                                                                                                                                 | Package-per-domain (00-conventions §3)                                                                                                                                                                                                                                                         |
| `apps/api/src/domains/*` (routes.ts)                                   | `apps/api/src/routers/<domain>-router.ts`                                                                                                                             | Only the thin tRPC-adapter part stays in the app                                                                                                                                                                                                                                               |
| `packages/db/src/transaction.ts` `tx` Proxy                            | `UnitOfWork` class                                                                                                                                                    | Removes Proxy "magic," adds isolation-level support, makes the DB handle constructor-injectable like every other dependency (00-conventions §10.2)                                                                                                                                             |
| `packages/integrations/src/icons8/*`                                   | deleted                                                                                                                                                               | Dead code — unused mock stub, never wired to any domain (verify no future plan needs it before deleting)                                                                                                                                                                                       |
| `apps/api/src/api/`                                                    | `apps/api/src/trpc/`                                                                                                                                                  | "api inside the api app" was redundant; renamed after the technology it wraps, matching `transport/`'s naming pattern                                                                                                                                                                          |
| `apps/api/src/api/setup.ts`                                            | `apps/api/src/trpc/init.ts`                                                                                                                                           | Name says exactly what it does (tRPC bootstrap) instead of the generic "setup"                                                                                                                                                                                                                 |
| `apps/api/src/api/discovery-context.ts`                                | folded into `apps/api/src/trpc/context.ts`                                                                                                                            | One 5-line helper didn't need its own file; "discovery" as a name explained nothing                                                                                                                                                                                                            |
| `apps/api/src/api/resilience/error-mapping.ts`                         | `apps/api/src/trpc/error-mapping.ts`                                                                                                                                  | `resilience/` oversold what's here (no retries/circuit-breakers) and became a one-file folder once `service-result.ts` is removed                                                                                                                                                              |
| `apps/api/src/api/resilience/service-result.ts`                        | deleted                                                                                                                                                               | Legacy `ServiceResult` call sites migrated to throwing `AppError`                                                                                                                                                                                                                              |
| `apps/api/src/transport/error-handling.ts`                             | `apps/api/src/transport/http-error-handler.ts`                                                                                                                        | Renamed to pair by name with `trpc/error-mapping.ts` — these are the HTTP-layer and tRPC-layer error handlers, not duplicates                                                                                                                                                                  |
| `apps/api/src/api/guards/*` (mixed shapes)                             | `apps/api/src/trpc/guards/middleware/*` + `apps/api/src/trpc/guards/assertions/*`                                                                                     | Split by calling shape: `middleware/` holds `Context`-shaped, `.use()`-able tRPC middleware; `assertions/` holds plain functions taking raw values, called manually. Every guard renamed to a consistent `require<Thing>` verb (never `is<Thing>` — none of them return a boolean, they throw) |
| `apps/api/src/api/guards/authorization.ts`                             | split into `require-organization-membership.ts`, `require-platform-admin.ts`, `require-permission.ts`, `assertions/has-permission.ts`                                 | One file was bundling three unrelated checks (DB membership, DB admin flag, Better Auth RBAC)                                                                                                                                                                                                  |
| `apps/api/src/api/guards/org-type.ts`                                  | split into `require-team-workspace.ts`, `require-solo-workspace.ts`, `assertions/require-team-organization-by-id.ts`, `assertions/require-solo-organization-by-id.ts` | Mixed current middleware, a `@deprecated` alias (deleted, not carried forward), and tx-shaped helpers in one file                                                                                                                                                                              |
| `apps/api/src/api/guards/active-seat.ts` `assertActiveSeat(tx, input)` | `apps/api/src/trpc/guards/middleware/require-active-seat.ts`, rewritten as a `Context`-shaped middleware                                                              | Previously the only guard that couldn't be `.use()`'d directly — `procedures.ts` had to hand-wrap it in an inline ad-hoc middleware                                                                                                                                                            |

## 7. Old → new mapping table (frontend "features" → "domains")

| App      | Old folder                                   | New folder                                                                       | Notes                                                                     |
| -------- | -------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `ops`    | `features/organizations`                     | `domains/organization`                                                           | Singular, matches backend                                                 |
| `ops`    | `features/gallery`                           | `domains/gallery` (panel only; view+hook move to `packages/ui`/`packages/hooks`) |                                                                           |
| `ops`    | `features/plans`                             | `domains/billing`                                                                | Matches backend `billing` domain noun                                     |
| `ops`    | `features/dashboard`                         | `pages/dashboard`                                                                | Composition, not a domain — owns no Store                                 |
| `ops`    | `features/users`                             | `domains/users`                                                                  |                                                                           |
| `portal` | `features/library-gallery`                   | `domains/gallery`                                                                | Collapses the two different names (`gallery`, `library-gallery`) into one |
| `portal` | `features/subscription`                      | `domains/billing`                                                                |                                                                           |
| `portal` | `features/members`                           | `domains/members`                                                                | Already matched, no rename                                                |
| `portal` | `features/seats`                             | `domains/seats`                                                                  | Already matched, no rename                                                |
| `portal` | `features/account`, `features/org-dashboard` | `pages/account`, `pages/org-dashboard`                                           | Compositions, not domains                                                 |
| `portal` | `features/join`                              | `pages/join`                                                                     | Composition (uses organization + members domains)                         |

## 8. DB rename accompanying the `gallery` collapse

Full detail in `packages/gallery.md`; summary here for the target-structure view:

| Old                                      | New                                      |
| ---------------------------------------- | ---------------------------------------- |
| Table `library_items`                    | `gallery_items`                          |
| `packages/db/src/library-catalog.ts`     | `packages/db/src/gallery-catalog.ts`     |
| `LibraryAssetClass`, `LibraryItemStatus` | `GalleryAssetClass`, `GalleryItemStatus` |
| `LibraryStore`, `LibraryRepository`      | `GalleryStore`, `GalleryRepository`      |
| `trpc.library.*`                         | `trpc.gallery.*`                         |

This requires one migration file (`ALTER TABLE library_items RENAME TO gallery_items;` etc.) — acceptable because the project isn't live yet (local Postgres only).
