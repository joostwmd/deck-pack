# deck-pack — Conventions & Architecture

This document is the single source of truth for _how_ we build, independent of _what_ we're building. Every app and package doc in this folder assumes you've read this first. When in doubt, this file wins over local habit.

Status: this captures decisions made during the architecture discussion prior to implementation. Nothing here is implemented yet — see `01-target-structure.md` for the destination and the per-app/per-package docs for the migration path of each unit.

---

## 1. Why we're doing this

Goals, in order:

1. **Legible on first read.** A grader/reviewer/new contributor should be able to open any file and know, from its location alone, what it's allowed to depend on and what depends on it.
2. **Boundaries enforced by the compiler/resolver, not by convention.** Wherever possible, make an architecture violation impossible to write, not just discouraged.
3. **One name per concept, everywhere.** The same noun is used in the DB, the domain layer, the router, and the frontend.
4. **Consistent style.** No mixing of class-based and function-factory styles for the same kind of thing. If use-cases are classes, all use-cases are classes.
5. **Testable without ceremony.** Every dependency on an external system (DB, HTTP API, Office.js, blob storage) sits behind an interface with a real implementation and an in-memory fake, so tests never need to mock at the framework level.

We are not optimizing for the smallest diff. This is a graded, from-scratch-tolerant refactor — clarity and explicit structure beat brevity.

---

## 2. Naming conventions

### 2.1 One noun, everywhere

For any given business concept, the exact same singular noun is used at every layer:

| Layer                        | Example                                                   |
| ---------------------------- | --------------------------------------------------------- |
| DB table / schema file       | `organizations` table, `schema/organization.ts`           |
| Repository interface / class | `OrganizationRepository`, `DrizzleOrganizationRepository` |
| Domain package               | `packages/organization`                                   |
| tRPC router key              | `trpc.organization.*`                                     |
| Frontend domain folder       | `apps/*/src/domains/organization/`                        |
| Store interface              | `OrganizationStore`                                       |
| Hook                         | `useOrganizations`, `useCreateOrganization`               |

No pluralization drift (`organization` vs `organizations` as a folder name), no synonym drift (`library` vs `gallery` vs `library-gallery` — pick one, see `packages/gallery.md` for the worked example of collapsing three names into one, including the DB migration).

**Rule:** before creating a new folder/class/interface for an existing concept, grep for how it's already named elsewhere in the stack. If a mismatch is found, fix the naming as its own isolated commit before doing anything else — don't tangle a naming fix with a behavior change.

### 2.2 What is a "feature"? — replaced by two precise concepts

"Feature" was ambiguous because it conflated two different things. We don't use the word anymore:

- **Domain** — a folder/package that maps 1:1 to a bounded context with its own Store/Repository, reused across screens. Named with the domain noun, singular: `organization`, `gallery`, `members`, `billing`.
- **Page** — a route-level composition that pulls from 2+ domains for one screen and owns no Store of its own: `dashboard`, `account`, `org-dashboard`.

If a folder doesn't own a Store/Repository and just assembles other domains' hooks for one screen, it's a page, not a domain — it goes in `pages/`, not `domains/`.

### 2.3 Class / file naming patterns

| Kind of thing               | Pattern                                     | Example                                                                    |
| --------------------------- | ------------------------------------------- | -------------------------------------------------------------------------- |
| Entity                      | `PascalCase` noun                           | `Organization`                                                             |
| Repository interface        | `<Noun>Repository`                          | `OrganizationRepository`                                                   |
| Repository implementation   | `<Provider><Noun>Repository`                | `DrizzleOrganizationRepository`, `InMemoryOrganizationRepository`          |
| Port interface (non-DB)     | `<Noun>Port` or `<Capability>Port`          | `ObjectStorage`, `LogoIntegrationPort`                                     |
| Port implementation         | `<Provider><Capability>`                    | `AzureObjectStorage`, `InMemoryObjectStorage`, `BrandfetchLogoIntegration` |
| Use case                    | One class per operation, verb-first         | `CreateOrganization`, `ListOrganizations`, `SearchLogos`                   |
| Domain error                | `<Reason>Error extends AppError`            | `OrganizationNotFoundError`, `StorageNotFoundError`                        |
| Factory function            | `create<Thing>(options): <ReturnInterface>` | `createErrorReporter`, `createMicrosoftSignInStrategy`                     |
| Strategy/Command interface  | `<Noun>Strategy` / `<Noun>Command`          | `SignOutStrategy`, `FormattingCommand`, `TextFixCommand`                   |
| In-memory test double       | `InMemory<Port>`                            | `InMemoryObjectStorage`, `InMemoryOrganizationRepository`                  |
| No-op test/disabled double  | `Noop<Port>`                                | `NoopMonitoring`, `NoopErrorReporter`                                      |
| React hook                  | `use<Noun>` / `use<Verb><Noun>`             | `useOrganizations`, `useCreateOrganization`                                |
| React view component        | `<Noun><Role>View`                          | `OrganizationListView`, `GalleryDetailView`                                |
| React data-wiring component | `<Noun><Role>Panel`                         | `OrganizationListPanel`                                                    |

### 2.4 File-per-class

Each class/interface pair gets its own file named after it in `kebab-case`: `organization-repository.ts` contains `OrganizationRepository` (interface) + its production implementation. This isn't a hard rule for tiny, always-co-located pairs (e.g. an in-memory fake can share a file with its interface if the file stays under ~60 lines), but the default is one primary export per file.

---

## 3. Layered architecture

### 3.1 The core insight: domain-slicing at the package boundary, layer-slicing inside each package

Two ways of organizing backend code were considered:

- **Feature-first** (`domains/organization/{routes,service,repository}.ts` all in one folder): great for naming clarity, bad for linting — an ESLint boundary rule can only classify by directory, and there's no directory boundary between `routes.ts` and `repository.ts` when they're siblings. Enforcement degrades to filename-suffix matching, which is easy for a human or an LLM to accidentally bypass by naming a file wrong.
- **Layer-first** (`repositories/`, `use-cases/`, `routers/` as top-level folders, domain name only in the filename): trivial to lint, but scatters "everything about organization" across folders.

**Resolution — do both, at different scopes:** domain-slice at the **package** boundary, layer-slice **inside** each package.

```
packages/organization/
  package.json              — depends only on @deck-pack/db (and its own devDeps); does NOT depend on other domain packages
  src/
    domain/                 — entities, value objects, domain errors — zero framework deps
    repositories/           — interface + Drizzle-backed implementation + in-memory fake
    use-cases/              — one class per operation
    index.ts                — the ONLY file whose exports are public; domain/ and repositories/ are not re-exported
```

This is strictly better than either option alone: the boundary between domains isn't enforced by a lint rule that could be misconfigured or disabled — it's enforced by the module resolver itself. `packages/organization/package.json` simply never lists `@deck-pack/gallery` as a dependency, so importing from it fails before ESLint even runs. Inside one package, the horizontal-layer ESLint rule is trivial and domain-agnostic (see §4), because there's only one domain per package, so no filename-suffix ambiguity exists.

**Cost, stated plainly:** this is one `package.json`, one `tsconfig`, one workspace entry per domain — real ceremony. That's an intentional trade for a capstone project that wants to _demonstrate_ strong architecture. The lighter alternative (one `packages/core` with per-domain subfolders, enforced via `eslint-plugin-boundaries` capture groups) is real and used in production DDD monorepos, but it's a linted guarantee, not a structural one. We're going with package-per-domain.

### 3.2 Canonical package-per-domain internal shape

```
packages/<domain>/
  package.json
  src/
    domain/
      <domain>.ts                    — entity/value object, e.g. class Organization { ... }
      errors.ts                      — <Domain>NotFoundError, etc. extends AppError
    repositories/
      <domain>-repository.ts         — interface + Drizzle<Domain>Repository
      in-memory-<domain>-repository.ts
    use-cases/
      create-<domain>.ts             — class Create<Domain> { constructor(repo) {} execute(input) {} }
      list-<domain>s.ts
      ...
    index.ts                          — exports only what apps/api's router needs: use-case classes, entity types, the repository interface (for DI typing), NOT the Drizzle implementation internals
```

ESLint boundary rule (identical for every domain package, written once):

```javascript
settings: {
  "boundaries/elements": [
    { type: "domain", pattern: "src/domain/**" },
    { type: "repository", pattern: "src/repositories/**" },
    { type: "use-case", pattern: "src/use-cases/**" },
  ],
},
rules: {
  "boundaries/element-types": ["error", {
    default: "disallow",
    rules: [
      { from: "domain", allow: [] },
      { from: "repository", allow: ["domain"] },
      { from: "use-case", allow: ["domain", "repository"] },
    ],
  }],
},
```

### 3.3 `apps/api` becomes thin

With domain logic in packages, `apps/api` only contains transport-facing code:

```
apps/api/src/
  routers/            — one file per domain, thin: input validation + call a use-case + return
  api/                — tRPC plumbing: root router composition, procedures, guards, context
  transport/          — Hono plumbing: CORS, security headers, health checks, request-context-aware middleware
  container.ts        — composition root: builds all repositories/ports and use-cases
  index.ts             — process entrypoint: init monitoring/logging, start server
  server.ts             — Hono app assembly via ApiAppBuilder (see §6)
  utils/                — generic helpers only (renamed from `lib/`)
```

A router file adapts a use-case to a tRPC procedure and nothing else:

```typescript
export function organizationRouter(container: AppContainer) {
  return router({
    create: protectedProcedure
      .input(createOrganizationInput)
      .mutation(({ input, ctx }) =>
        new CreateOrganization(container.organizationRepository).execute(input, ctx.user),
      ),
  });
}
```

### 3.4 Frontend mirrors the same "apps thin, packages fat" idea

```
apps/<app>/src/
  main.tsx                — composition root: initBrowserSentry, build router, mount React
  routes/                 — TanStack Router file-based routes, thin
  pages/                  — route-level compositions spanning 2+ domains (dashboard, account)
  domains/<name>/         — panels only: data-wiring + injecting app-specific permission checks
  services/               — app-services.ts (DI container of Store implementations), services-context.tsx
  local/                   — the ONE deliberate escape hatch for genuinely single-app UI (see §5)
  config/
  utils/
```

Views and hooks are **not** duplicated per app — see §5.

---

## 4. Boundaries & linting

### 4.1 Why linting matters more than usual here

AI-assisted development (and, frankly, humans in a hurry) will follow the path of least resistance. If the _only_ thing preventing a shortcut import is a convention documented in a markdown file, it will eventually be violated and nobody will notice until it's load-bearing. Two enforcement layers, from strongest to weakest:

1. **Package dependency graph (strongest, zero config drift possible).** If package A's `package.json` doesn't list package B as a dependency, `import` from B fails module resolution. This is why domain-slicing happens at the package level (§3.1) — it's not a style choice, it's the enforcement mechanism.
2. **`eslint-plugin-boundaries` (strong, but a rule that could be misconfigured or disabled).** Used _within_ a package to enforce the horizontal-layer rule (§3.2), and at the app level for the app-specific rules below.
3. **Naming convention alone (weakest).** Only relied on where the first two don't apply — e.g. within a single flat file, class naming.

### 4.2 App-level boundary rules

```javascript
settings: {
  "boundaries/elements": [
    { type: "router", pattern: "apps/api/src/routers/**" },
    { type: "trpc-plumbing", pattern: "apps/api/src/trpc/**" },
    { type: "transport", pattern: "apps/api/src/transport/**" },
  ],
},
rules: {
  "boundaries/element-types": ["error", {
    default: "allow",
    rules: [
      // routers may not reach into transport internals or call Drizzle directly
      { from: "router", disallow: ["transport"] },
    ],
  }],
},
```

Plus a blanket rule (any package, any app): no file under `packages/db/src/queries/**` may be imported directly from `apps/*` — only domain packages' repositories may import `@deck-pack/db`.

### 4.3 What this would have caught

The original leak that motivated this whole exercise:

```typescript
// apps/api/src/domains/library/service.ts — used to import straight past the repository layer
import { createLibraryItem } from "@deck-pack/db/queries/createLibraryItem";
```

Under the target architecture this import doesn't even parse as valid, because `apps/api` doesn't depend on `@deck-pack/db` at all — only `packages/gallery` does, and only its `repositories/` folder is allowed to import it.

---

## 5. Central UI & hooks — removing the "shared or not" decision

Per-file judgment calls about "should this hook/component be shared" are themselves a design smell. The fix is to remove the decision:

- **All React hooks live in `packages/hooks`**, one subfolder per domain (`packages/hooks/src/organization/use-organizations.ts`).
- **All React view components live in `packages/ui`**, split into:
  - `components/system/` — design-system primitives (Button, Input) — app-agnostic, no business meaning.
  - `components/composite/` — generic assembled components, still app-agnostic.
  - `components/<domain>/` — domain-specific but cross-app views (`OrganizationListView`, `GalleryDetailView`).
- **Apps keep only `panels`** — thin per-app files that pick a hook + a view and inject app-specific behavior (e.g. ops's `OrganizationDetailPanel` shows a "force delete" button portal's never does — that's a panel-level difference, not a view or hook difference).

**The one documented escape hatch:** `apps/<app>/src/local/` for the rare case that's genuinely one-app-only and will never be reused. Naming it `local` makes the exception visible and intentional instead of becoming a second, silent dumping ground.

**Migration note:** `packages/library-admin` (an in-progress extraction of gallery UI shared between `ops` and `portal`) is superseded by this rule — its contents move into `packages/ui/src/components/gallery/` and `packages/hooks/src/gallery/` rather than remaining a standalone "feature-slice" package. See `packages/gallery.md`.

### 5.1 Store implementations also live centrally

The Store interface + its tRPC-backed implementation (what a hook calls into) lives alongside the hook, in `packages/hooks/src/<domain>/<domain>-store.ts` — both apps hit the same backend, so there's no reason to duplicate the implementation per app. Apps only provide the concrete `trpc` client instance at composition time (`apps/*/src/services/app-services.ts`).

---

## 6. Composition & construction patterns

### 6.1 Builder — for assembling the Hono app

`createApp()` was a single function doing sequential, order-dependent `.use()` calls. A builder makes each step named and independently omittable — critical for tests, where you want the app _without_ monitoring/CORS/etc. wired in, rather than either letting it run or forking the function:

```typescript
class ApiAppBuilder {
  private steps: Array<(app: Hono<AppEnv>) => void> = [];
  private router: AppRouter | null = null;

  withCors(): this {
    this.steps.push((app) => app.use("*", corsMiddleware));
    return this;
  }
  withSecurityHeaders(): this {
    /* ... */ return this;
  }
  withMonitoring(monitoring: RequestMonitoring): this {
    this.steps.push((app) => monitoring.register(app));
    return this;
  }
  withRouter(router: AppRouter): this {
    this.router = router;
    return this;
  }

  build(): Hono<AppEnv> {
    if (!this.router) throw new Error("ApiAppBuilder.build() requires withRouter()");
    const app = new Hono<AppEnv>();
    for (const step of this.steps) step(app);
    app.use("/trpc/*", trpcServer({ router: this.router, createContext, onError }));
    registerHealthRoutes(app);
    registerErrorHandlers(app);
    return app;
  }
}
```

Production: `.withCors().withSecurityHeaders().withMonitoring(monitoring).withRouter(router).build()`. Tests: omit `.withMonitoring()` or pass a `NoopMonitoring`.

### 6.2 Factory functions — for picking a concrete implementation

Whenever "which concrete class do I construct" depends on config/environment, that decision is owned by one `create<Thing>(options)` function, not inlined at the call site as a ternary. This was already the existing convention for auth strategies (`createMicrosoftSignInStrategy`, `createSignOutStrategy` in `packages/auth`) — extend it everywhere the same shape of decision occurs:

```typescript
// Before — the decision is buried in a ternary at the composition root
const monitoring = env.APITALLY_CLIENT_ID
  ? new ApitallyMonitoring({ clientId: env.APITALLY_CLIENT_ID, env: env.APITALLY_ENV })
  : new NoopMonitoring();

// After — the decision is owned by one function, testable on its own
export function createRequestMonitoring(options: {
  clientId: string | undefined;
  env: string;
}): RequestMonitoring {
  if (!options.clientId) return new NoopRequestMonitoring();
  return new ApitallyRequestMonitoring({ clientId: options.clientId, env: options.env });
}
```

Precedent already in the codebase (`packages/auth/src/sign-out-strategy.ts`):

```typescript
export function createSignOutStrategy(options: { host: MicrosoftSignInHost; ... }): SignOutStrategy {
  if (options.host === "office") {
    if (!options.bearerStore || ...) {
      throw new Error("Office sign-out requires bearerStore, continuityStore, microsoftTokenCache, and clientId.");
    }
    return new OfficeBearerSignOutStrategy(...);
  }
  return new WebCookieSignOutStrategy(options.authClient);
}
```

### 6.3 Interface Segregation — don't merge unrelated capabilities into one port

Two providers that both sound like "monitoring" (Sentry, Apitally) are NOT merged into one `MonitoringPort`. They have genuinely different shapes:

- Apitally instruments the Hono `app` object once, at assembly time → `RequestMonitoring.register(app): void`.
- Sentry is called repeatedly from arbitrary places with no relationship to `app` → `ErrorReporter.captureException(error, context): void`.

This mirrors a decision already made in `packages/auth`: `MicrosoftSignInStrategy` and `SignOutStrategy` are two separate interfaces, not one combined `AuthStrategy`. Forcing unrelated capabilities behind one interface makes every consumer depend on methods it doesn't call, and makes "one provider configured, the other isn't" impossible to represent without a fake hybrid instance. When two things merely _look_ similar internally (e.g. three HTTP clients that each hand-roll fetch/parse/error-mapping), that's solved with a shared **helper function**, not a shared **port** — see §8.2 for the distinction.

---

## 7. Error handling

- Move from the current `ServiceResult` discriminated-union style to a class-based `AppError` hierarchy — more idiomatic for the OOP direction the rest of the codebase is taking.
- Base class `AppError extends Error` with a `code` and `httpStatus`; each domain defines its own subclasses (`OrganizationNotFoundError`, `StorageNotFoundError` — the latter already exists and is the model to follow).
- A single error-mapping middleware at the tRPC layer (`apps/api/src/trpc/error-mapping.ts` — keeps its current job) converts `AppError` subclasses to the right `TRPCError` code. This is the only place that needs to know the mapping; use-cases just `throw` domain errors and don't know tRPC exists.

---

## 8. Package taxonomy

Not every package is the same _kind_ of thing, and forcing one folder shape onto all of them is a mistake. Instead, every package must declare which of four kinds it is, and each kind has its own canonical internal shape.

### 8.1 The four kinds

| Kind          | Purpose                                                                                               | Examples                                                                      | Internal shape                                                                                                                                                       |
| ------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **domain**    | Pure business logic + persistence for one bounded context, zero framework deps beyond `@deck-pack/db` | `organization`, `gallery`, `billing`                                          | `domain/`, `repositories/`, `use-cases/`, `index.ts` (see §3.2)                                                                                                      |
| **adapter**   | Wraps one external system behind a port                                                               | `storage`, `integrations`, `office-js`                                        | `port.ts` + `adapters/` (single target) OR one subfolder per provider (multi-provider) OR one subfolder per capability (one target, many capabilities — `office-js`) |
| **infra**     | Framework/tooling glue, no business logic                                                             | `db`, `auth`, `env`, `config`, `observability`, `trpc-client`                 | thin `index.ts` + init/config files; `db` additionally owns `queries/`/`schema/` since that's its entire purpose                                                     |
| **ui-shared** | Cross-app React code, two sub-kinds                                                                   | **design-system**: `ui` — app-agnostic. **feature-slice**: superseded, see §5 | see §5 for the current shape                                                                                                                                         |

### 8.2 Port vs. shared helper — when each is warranted

Two different problems get confused under "these three things look similar," and they have different fixes:

- **Port** — warranted when calling code needs to be polymorphic over multiple implementations, OR (just as importantly, and the reason we initially undersold this) when you want a real implementation + an in-memory fake purely for **testability**, even if there's only ever one real implementation. `ObjectStorage` (`AzureObjectStorage` / `InMemoryObjectStorage`) exists for the second reason, not the first — there's no runtime scenario where you swap Azure for another blob provider, the fake exists purely so tests don't hit the network.
- **Shared helper** — warranted when several classes happen to repeat the same _internal_ plumbing (fetch → check status → map to typed error → parse with zod) but nothing in the calling code treats them interchangeably. Fix: extract a helper function into a private subfolder of the _same_ package (e.g. `packages/integrations/src/shared/fetch-json.ts`), not a new port and not a new package.

Concretely, for the three live `packages/integrations` clients (Brandfetch, Pexels, NounProject): no shared _port_ between them (a logo search and an icon search aren't interchangeable), but each domain that consumes one gets its _own_ port, owned by the domain, for the testability reason:

```typescript
// packages/logos/src/logo-integration-port.ts — lives WITH the domain, not with the raw SDK client
export interface LogoIntegrationPort {
  search(query: string, options?: { limit?: number }): Promise<LogoSearchResult[]>;
  getDetails(identifier: string): Promise<LogoSearchResult>;
}
// BrandfetchLogoIntegration implements LogoIntegrationPort — translates BrandfetchClient's raw shape into the domain's shape
// InMemoryLogoIntegration implements LogoIntegrationPort — for tests
```

`BrandfetchClient` itself (in `packages/integrations`) stays a low-level raw-SDK wrapper with zero deck-pack domain knowledge — the same relationship `packages/db` has to a domain package's Repository.

### 8.3 New package vs. new folder in an existing package

- **New top-level package** — when the code will be consumed by 2+ _other_ packages/apps, or when it's a self-contained instance of one of the four kinds above that doesn't have a natural home yet.
- **New folder in an existing package** — when the code is only ever consumed by siblings _within_ that same package. Don't add it to the package's `exports` map in `package.json`, and it's private by construction — no lint rule needed to enforce it, module resolution does it for you.

### 8.4 Decision: `packages/office-js` stays one package, not one-per-domain

Confirmed by reading the actual dependency graph (`package.json` files + source), not assumed: **`packages/office-js` is the only package in the whole repo with a real Office.js dependency.** Every domain-specific package it touches (`@deck-pack/agenda`, `@deck-pack/presentation-check`/`brand-compliance`, `@deck-pack/presentation-formatting`/`shape-commands`) is pure — zero Office.js, zero DOM, zero framework — and `office-js` **depends on them**, not the other way around:

```typescript
// packages/office-js/package.json (confirmed)
"dependencies": {
  "@deck-pack/agenda": "workspace:*",
  "@deck-pack/presentation-check": "workspace:*",
  "@deck-pack/presentation-formatting": "workspace:*"
},
"devDependencies": { "@types/office-js": "^1.0.514", /* ... */ }
```

`packages/office-js/src/agenda/scan-agenda-deck.ts` is the concrete example: it's the only file with real `PowerPoint.Slide`/`context.sync()` calls, and it scans the live deck into `@deck-pack/agenda`'s plain `ObservedDeck` shape before handing off to that package's pure `reconcile()`.

The domain footprint is **not symmetric across domains**, which is the actual reason this stays one package instead of splitting into `agenda-officejs`/`shape-commands-officejs`/etc.:

| Domain                      | Pure logic package                                    | Office.js-specific glue?                                                                                                                                    | DB-backed domain?                      |
| --------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| agenda                      | `packages/agenda`                                     | Yes — `office-js/src/agenda/` (scan + apply against the live deck)                                                                                          | Yes — `apps/api/src/domains/agenda`    |
| shape-commands (formatting) | `packages/presentation-formatting` → `shape-commands` | Yes — `office-js/src/format/` (executes a command against a live selection)                                                                                 | No                                     |
| brand-compliance (checks)   | `packages/presentation-check` → `brand-compliance`    | Yes — `office-js/src/fixes/` (applies a fix against a live shape)                                                                                           | No                                     |
| shortcuts                   | `packages/shortcuts`                                  | **No** — keybinding capture is a browser/DOM concern (`apps/addins/assets/src/{lib,hooks,providers}/*shortcut*`), never touches the PowerPoint object model | Yes — `apps/api/src/domains/shortcuts` |

Every domain that _does_ have Office.js-specific glue already gets its own capability subfolder inside `office-js/` (`agenda/`, `format/`, `fixes/`) — decided **not** to promote these to sibling top-level packages (`agenda-officejs`, etc.), and to leave `shortcuts` without an Office.js package entirely, since it has no Office.js-touching code to put in one. One unified adapter package, one subfolder per capability, is simpler than three-to-four small packages with inconsistent existence across domains, and §8.3 above ("new folder in an existing package, when the code is only ever consumed by siblings") already covers exactly this case — nothing outside `apps/addins` consumes `office-js/src/agenda/` directly except through the package's own `index.ts`.

---

## 9. Testing & dependency injection

### 9.1 Current state (for accuracy, not aspiration)

Tests currently hit a **real Postgres** database (`pg.Pool` against `DATABASE_URL`) and hand-construct session cookies (`serializeSignedCookie` + manual `db.insert(user)`/`db.insert(session)`). This works, but it's not what we're moving to.

### 9.2 Target state

- **Database:** PGlite (WASM Postgres) instead of a real Postgres connection for integration tests — same SQL dialect/constraints as production, but in-memory and disposable per test run.
- **Auth:** Better Auth's own `testUtils()` plugin + `getTestInstance()`, giving `ctx.test.createUser()`, `.saveUser()`, `.getAuthHeaders()`, `.login()` — replacing the hand-rolled cookie signing. Point its adapter at the same PGlite instance for full parity with production Drizzle/Postgres behavior (not Better Auth's built-in `sqlite` test mode, which is a different SQL dialect).
- **Every port gets an `InMemory*` implementation**, no exceptions — this is the single rule that replaces "figure out how to mock X for this test":

  | Port                     | Production                      | Test fake                                |
  | ------------------------ | ------------------------------- | ---------------------------------------- |
  | `ObjectStorage`          | `AzureObjectStorage`            | `InMemoryObjectStorage` (already exists) |
  | `OrganizationRepository` | `DrizzleOrganizationRepository` | `InMemoryOrganizationRepository`         |
  | `LogoIntegrationPort`    | `BrandfetchLogoIntegration`     | `InMemoryLogoIntegration`                |
  | `ErrorReporter`          | `SentryErrorReporter`           | `NoopErrorReporter`                      |
  | `RequestMonitoring`      | `ApitallyRequestMonitoring`     | `NoopRequestMonitoring`                  |

  Every fake gets a `.seed(...)` method for pre-loading fixture state, matching the existing `MemoryObjectStorage.seed()`.

### 9.3 `AppContainer` — the single DI seam

The existing `CreateAppOptions.router?` override in `apps/api/src/server.ts` is generalized into a full container with three named factory methods. Every Repository is constructed with a `UnitOfWork` instance (§10.2) — **the same instance** is passed to every Repository within one container, so a `withTransaction()` call started in one Repository is visible to another Repository's `getDb()` call within the same request:

```typescript
class AppContainer {
  constructor(
    public readonly organizationRepository: OrganizationRepository,
    public readonly galleryRepository: GalleryRepository,
    public readonly objectStorage: ObjectStorage,
    public readonly logoIntegration: LogoIntegrationPort,
    // ... one field per port, growing as domains are migrated
  ) {}

  static production(): AppContainer {
    return new AppContainer(
      new DrizzleOrganizationRepository(unitOfWork), // unitOfWork = the one production instance exported by @deck-pack/db
      new DrizzleGalleryRepository(unitOfWork),
      new AzureObjectStorage(azureConfig),
      new BrandfetchLogoIntegration(new BrandfetchClient(brandfetchConfig)),
    );
  }

  static forIntegrationTest(db: PgliteDatabase): AppContainer {
    const uow = new UnitOfWork(db); // a fresh instance, backed by PGlite instead of prod Postgres
    return new AppContainer(
      new DrizzleOrganizationRepository(uow), // same Repository class, different UnitOfWork
      new DrizzleGalleryRepository(uow),
      new InMemoryObjectStorage(),
      new InMemoryLogoIntegration(),
    );
  }

  static forUnitTest(overrides: Partial<AppContainerDeps> = {}): AppContainer {
    return new AppContainer(
      overrides.organizationRepository ?? new InMemoryOrganizationRepository(),
      overrides.galleryRepository ?? new InMemoryGalleryRepository(),
      overrides.objectStorage ?? new InMemoryObjectStorage(),
      overrides.logoIntegration ?? new InMemoryLogoIntegration(),
    );
  }
}
```

A full integration test then reads as:

```typescript
const db = await createPgliteTestDb();
const { auth, client } = await getTestInstance({ plugins: [testUtils()], database: db });
const testCtx = await auth.$context;
const testUser = await testCtx.test.saveUser(await testCtx.test.createUser());
const headers = await testCtx.test.getAuthHeaders(testUser);

const container = AppContainer.forIntegrationTest(db);
const app = new ApiAppBuilder().withRouter(organizationRouter(container)).build();

const res = await app.request("/trpc/organization.list", { headers });
```

Everything below `app.request` is real (real Drizzle queries against real, in-memory Postgres; real Better Auth session validation). Everything about transport wiring (CORS, Apitally, Sentry) is simply absent because the builder was never given those steps — no mocking required, because it was never built.

### 9.4 Isolation levels

`UnitOfWork.withTransaction` takes an options parameter so a call site _can_ request `serializable`/`repeatable read` when it hits a real concurrency bug (e.g. two requests assigning the last seat) — see §10.2 for the replacement of the `tx` Proxy, which currently makes this literally impossible to request.

---

## 10. Pattern glossary — what's used where and why

| Pattern                                      | Where                                                                                          | Problem it solves                                                                                                                                                                                                   |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Repository**                               | Every domain package's `repositories/`                                                         | Decouples use-cases from Drizzle; enables `InMemory*` fakes for tests                                                                                                                                               |
| **Port / Adapter**                           | `storage`, integration ports per domain, `office-js`                                           | Decouples domain/use-case code from a specific external system                                                                                                                                                      |
| **Use Case**                                 | One class per operation in `use-cases/`                                                        | Single-responsibility business operations, independently testable, no framework deps                                                                                                                                |
| **Strategy**                                 | `MicrosoftSignInStrategy`, `SignOutStrategy` (existing), `FormattingCommand`, `TextFixCommand` | Multiple interchangeable algorithms selected at runtime by a factory function                                                                                                                                       |
| **Command**                                  | `packages/shape-commands` registry, `packages/brand-compliance` fix registry                   | Encapsulates "an operation + how to check if it's applicable + how to apply it" as a data object looked up by id, so adding a new one means adding one class, not editing a `switch`                                |
| **Builder**                                  | `ApiAppBuilder`                                                                                | Named, independently-omittable construction steps; critical for building a test app without full production wiring                                                                                                  |
| **Factory function**                         | `createErrorReporter`, `createRequestMonitoring`, `createSignOutStrategy` (existing)           | Owns "which concrete implementation for this config" in one place instead of an inlined ternary at every call site                                                                                                  |
| **Saga (compensating transactions)**         | Any use-case spanning two systems that don't share a transaction (DB + blob storage)           | Best-effort rollback via a LIFO stack of compensation functions — NOT a substitute for a real transaction; only reach for this when Postgres's own `withTransaction` can't cover the whole operation                |
| **Unit of Work**                             | `UnitOfWork` class in `packages/db`                                                            | Tracks the current transaction (if any) via `AsyncLocalStorage` and exposes `getDb()`/`withTransaction()` as methods on an injectable object, instead of free functions tied to a hardcoded module-level connection |
| **Dependency Injection (constructor-based)** | Every use-case, repository, adapter                                                            | Testability — swap real implementations for fakes without touching business logic                                                                                                                                   |

### 10.1 Saga — precise definition

> "Is the Saga the stack of functions that need to be reverted?" — yes, exactly.

```typescript
class Saga {
  private readonly compensations: Array<() => Promise<void>> = [];

  onRollback(compensate: () => Promise<void>): void {
    this.compensations.push(compensate);
  }

  async rollback(): Promise<void> {
    for (const compensate of this.compensations.reverse()) {
      // LIFO — undo most recent success first
      try {
        await compensate();
      } catch {
        // swallow — a failed compensation must not block the others; log/alert in production
      }
    }
  }
}
```

Two things to never forget: (1) it is **not atomic** — between step 1 succeeding and step 2 failing, another request can observe the half-finished state; (2) compensations can themselves fail, and a failed compensation means an orphaned resource that needs alerting, not silent failure.

### 10.2 The `tx` Proxy → `UnitOfWork`

The current `Proxy`-based transaction handle is replaced with an injectable class, removing dynamic property-trap "magic" in favor of something a reader can trace in three lines, and adding the isolation-level support that was previously impossible to request. This is deliberately a **class**, not a pair of free functions — the same reasoning as `Saga` (§10.1): an object is constructor-injectable, so a Repository declares its dependency explicitly instead of importing a hardcoded module-level connection, and a test can hand it a PGlite-backed instance instead of production Postgres.

```typescript
export type TransactionOptions = {
  isolationLevel?: "read committed" | "repeatable read" | "serializable";
};

export class UnitOfWork {
  private readonly transactionStorage = new AsyncLocalStorage<Transaction>();

  constructor(private readonly db: Database) {}

  /** The current transaction if one is active on this async context, otherwise the base connection. */
  getDb(): Transaction | Database {
    return this.transactionStorage.getStore() ?? this.db;
  }

  async withTransaction<T>(fn: () => Promise<T>, options?: TransactionOptions): Promise<T> {
    const active = this.transactionStorage.getStore();
    if (active) {
      if (options?.isolationLevel)
        throw new Error("Cannot request an isolation level for a transaction already in progress");
      return fn();
    }
    return this.db.transaction(
      (transaction) => this.transactionStorage.run(transaction, fn),
      options?.isolationLevel ? { isolationLevel: options.isolationLevel } : undefined,
    );
  }
}
```

`packages/db/src/index.ts` exports exactly one production instance — `export const unitOfWork = new UnitOfWork(db);` — which every Repository in `AppContainer.production()` receives via its constructor (§9.3). `AppContainer.forIntegrationTest(db)` constructs a **fresh** `UnitOfWork` backed by the PGlite `db` handed to it, so tests never touch the production instance.

Every repository method calls `this.uow.getDb()` explicitly instead of importing `tx` and relying on the Proxy's implicit fallthrough:

```typescript
class DrizzleOrganizationRepository implements OrganizationRepository {
  constructor(private readonly uow: UnitOfWork) {}

  async findById(id: string): Promise<Organization | null> {
    const db = this.uow.getDb();
    // ... query using db ...
  }
}
```

**Lifetime — do not confuse this with `Saga`:** one `UnitOfWork` instance is created per logical database connection (one in production, one per integration test) and shared across every Repository in an `AppContainer`, for the lifetime of that container. A `Saga` (§10.1) is the opposite — a new instance per use-case call, discarded once that operation finishes. Sharing a single `UnitOfWork` across Repositories is what makes `withTransaction()` started in one Repository visible to another Repository's `getDb()` call within the same request (via `AsyncLocalStorage`); a `Saga` has no such propagation concern because it only ever holds plain callback references.

---

## 11. Code style

- **No mixing OOP and functional for the same kind of thing.** If use-cases are classes, every use-case is a class — including the ones that currently look "too simple to need a class" (`icons`/`photos`/`logos` services). Consistency beats saving three lines.
- **Constructor injection everywhere.** Classes take their dependencies (repositories, ports) as constructor parameters, never import a concrete implementation directly.
- **No comments that narrate what code does.** Comments explain non-obvious intent, trade-offs, or constraints (e.g. why a table name doesn't match its class name after a rename) — not "// create the user".
- **Every `create<Thing>` factory function is unit-testable on its own**, independent of the system it's wiring together — if you can't easily test "given this config, do I get a `Noop` or a real implementation," the factory is doing too much.

---

## 12. tRPC guard naming & layout

Applies to every guard in `apps/api/src/trpc/guards/` (see `apps/api.md` for the full before/after). Two rules, both aimed at making the calling shape visible without opening the file:

1. **Split by calling shape into two subfolders**, never mixed in one file or one folder:
   - `guards/middleware/` — every export is a `Context`-shaped `middleware<Context>(...)`, directly `.use()`-able onto a procedure chain. If a check needs to become a guard but currently takes raw values (`tx`, an id) instead of `Context`, rewrite it to read those off `ctx` itself — never hand-wrap it in an ad-hoc inline `middleware(...)` at the call site. A guard that can't be `.use()`'d like its siblings is a sign it was written in the wrong shape, not that the call site needs special-casing.
   - `guards/assertions/` — plain async functions taking raw values, called manually from inside a `middleware/*` file or a use-case. These are not middleware and never claim to be.
2. **Every guard export is named `require<Thing>`, never `is<Thing>` or `assert<Thing>`.** Pick one verb across the whole codebase. `is<Thing>` implies a boolean-returning predicate; every guard here either passes through or throws, so naming it `is*` is actively misleading. `require<Thing>` reads correctly for both subfolders (`requireAuthenticatedSession` as middleware, `requireActiveOrganizationId` as an assertion) and for the domain-layer use-case guards that follow the same idea (e.g. a use-case's own precondition checks).

One file, one guard. A file that currently bundles multiple unrelated checks (e.g. an org-membership check and a platform-admin check and a Better-Auth RBAC check, just because they're all "authorization-flavored") gets split one-per-file during the same pass — the goal is that the folder listing alone tells a reader what exists and how to call it, no need to open every file to find out.
