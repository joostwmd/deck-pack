# Architecture linting — oxlint inventory

Reference: [00-conventions-and-architecture.md](../00-conventions-and-architecture.md) §4. Config lives in [`.oxlintrc.json`](../../.oxlintrc.json) at the repo root.

**Tooling decision:** this repo uses **oxlint** (not ESLint). Architecture boundaries are enforced with `no-restricted-imports` overrides (`paths` + `patterns` + custom `message`), scoped by file globs. Lefthook pre-commit and CI (`.github/workflows/pull-request-ci.yml`) already run `pnpm oxlint`.

## Enforcement stack (strongest → weakest)

| Layer | Mechanism                                | What it catches                                                                                                                    |
| ----- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 1     | `package.json` dependencies              | Cross-package imports that were never declared — module resolution fails before lint runs                                          |
| 2     | Oxlint `no-restricted-imports` overrides | Within-package horizontal layers (`domain` / `repositories` / `use-cases`) and app folder roles (`routers` / `trpc` / `transport`) |
| 3     | Naming conventions                       | Class/file naming when layers 1–2 don't apply                                                                                      |

## How to verify

```bash
pnpm oxlint          # same as CI
pnpm oxlint:strict   # type-aware (optional, not in CI today)
```

Pre-commit (lefthook) runs `pnpm oxlint -- --fix` on staged `*.{ts,tsx,js,jsx,mjs,cjs}` files.

---

## Phase 1 — active on today's tree

These rules apply **now** to the current codebase layout.

### `apps/api` — vertical slice (pre-package extraction)

| Files                                                       | Severity | Restricted                                                         |
| ----------------------------------------------------------- | -------- | ------------------------------------------------------------------ |
| `apps/api/src/domains/**/routes.ts`, `**/*-routes.ts`       | error    | `drizzle-orm`, `@trpc/server`, `@deck-pack/db`, `@deck-pack/db/**` |
| `apps/api/src/domains/**/service.ts`, `**/*-service.ts`     | error    | `@trpc/server`, `hono`                                             |
| `apps/api/src/api/guards/**`, `apps/api/src/trpc/guards/**` | error    | `**/domains/**` (no domain services/routes in guards)              |

**Rationale:** routes are transport adapters; services hold business logic but must not know tRPC/Hono. Guards compose middleware only. DB query imports in services/guards remain allowed until domain packages land.

### Frontend — panels vs views

| Files                                                                         | Severity | Restricted                                                                          |
| ----------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------- |
| `apps/*/src/components/**`, `hooks/**`, `lib/**`, `features/**`, `domains/**` | warn     | `@/utils/trpc`, `@/utils/auth` (panels should use Stores; migration in progress)    |
| `apps/*/src/**/*-view.tsx`                                                    | error    | `@/services` (views stay dumb)                                                      |
| `apps/addins/assets/src/{lib,hooks,features,components}/**`                   | error    | named import `officeClient` from `@deck-pack/office-js` (use hooks/context instead) |

---

## Phase 2 — active when target folders exist

These overrides are **already in config** but only match files once the refactor creates the folders. No violations today because the globs match zero files (or only empty paths).

### `apps/api` — target layout

| Files                       | Severity | Restricted                                                                    | Activates when                                               |
| --------------------------- | -------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `apps/api/src/routers/**`   | error    | `drizzle-orm`, `hono`, `@deck-pack/db`, `@deck-pack/db/**`, `../transport/**` | First `*-router.ts` lands in `routers/`                      |
| `apps/api/src/trpc/**`      | error    | `@deck-pack/db/queries/**`                                                    | `api/` renamed to `trpc/` (dual-glob both during transition) |
| `apps/api/src/transport/**` | error    | `@trpc/server`, `@deck-pack/db/queries/**`                                    | Already active — `transport/` exists today                   |

### Domain packages — horizontal layers (§3.2)

| Files                            | Severity | Restricted                                                                                                          | Activates when                                                          |
| -------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `packages/*/src/domain/**`       | error    | `@deck-pack/db`, `@deck-pack/db/**`, `drizzle-orm`, `@trpc/server`, `hono`, `../repositories/**`, `../use-cases/**` | First domain package created (e.g. `packages/organization/src/domain/`) |
| `packages/*/src/repositories/**` | error    | `@trpc/server`, `hono`, `../use-cases/**`                                                                           | Same — `repositories/` folder appears                                   |
| `packages/*/src/use-cases/**`    | error    | `@deck-pack/db`, `@deck-pack/db/**`, `drizzle-orm`, `@trpc/server`, `hono`                                          | Same — `use-cases/` folder appears                                      |

Repositories **may** import `@deck-pack/db` and Drizzle. Use-cases may import repository **interfaces** from `../repositories` but not Drizzle directly.

### Shared UI (when `packages/hooks` exists)

| Files                           | Severity | Restricted                                | Activates when                      |
| ------------------------------- | -------- | ----------------------------------------- | ----------------------------------- |
| `packages/ui/src/components/**` | warn     | `@deck-pack/hooks`, `@deck-pack/hooks/**` | `packages/hooks` package is created |

---

## Phase 2d — deferred (warn → error flip)

Not in config yet. Add when the first domain package is extracted:

| Files                                                       | Severity (initial) | Restricted                 | Flip to error when                                                                                                     |
| ----------------------------------------------------------- | ------------------ | -------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `apps/api/src/**` (excluding `domains/**` during migration) | warn               | `@deck-pack/db/queries/**` | `apps/api` no longer imports query files in `router.ts` / composition root; all DB access goes through domain packages |

Today `apps/api/src/api/router.ts` and many `domains/**/service.ts` files import `@deck-pack/db/queries/**` — a blanket error would fail CI immediately.

---

## Adding a new rule

1. Add an `overrides` entry to [`.oxlintrc.json`](../../.oxlintrc.json) with a narrow `files` glob and a clear `message`.
2. Run `pnpm oxlint` — expect zero new errors on the current tree unless you're intentionally fixing violations in the same PR.
3. Document the rule in this file (table row + "activates when" if dormant).
4. Mirror the intent in [00-conventions-and-architecture.md](../00-conventions-and-architecture.md) §3.2 or §4 if it's a new layer rule.

## What oxlint cannot express (package.json handles it instead)

- Cross-domain imports (`packages/organization` → `packages/gallery`) — use `package.json` `dependencies`, not lint rules.
- Full dependency graphs between arbitrary folder types — oxlint has no `eslint-plugin-boundaries` equivalent; we use folder-scoped `no-restricted-imports` instead.
