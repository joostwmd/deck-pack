# `packages/agenda` — pure computation package, no change needed

Kind: neither domain, adapter, infra, nor ui-shared in the strict sense — a **pure computation library** (no external system, no framework dependency, no side effects). Lowest priority alongside `packages/trpc-client` and `packages/shortcuts`. Documented for completeness; not being restructured.

**Naming note:** disambiguate this from the backend `agenda` domain in `apps/api/src/domains/agenda/` (DB-backed, persists agenda instances) — see `01-target-structure.md` §5 for the proposed rename of the backend domain to `packages/agenda-service` to avoid a name collision. This package (`packages/agenda`) keeps its name.

## Current state (confirmed)

```
packages/agenda/src/
  reconcile.ts             — reconciliation logic between an agenda's current state and slide content
  build-update-plan.ts       — produces an update plan (add/remove/reorder agenda entries) from a reconciliation result
  analytics.ts
  schemas.ts
  types.ts
  constants.ts
  index.ts
```

## Why this stays functional

`reconcile()` and `buildUpdatePlan()` are pure transformations: given an agenda snapshot and slide data, compute a diff/plan. There's no state to construct once and reuse across calls, no external dependency to inject, and no interface this needs to implement polymorphically — the "OOP everywhere" convention (§11) is specifically about not mixing styles _for the same kind of thing_ (e.g. all use-cases being classes); it's not a mandate to wrap every function in a class regardless of whether the class would hold anything. A `class AgendaReconciler { reconcile(input) {...} }` with no constructor and no fields would be a class in name only — this is the same reasoning that keeps `packages/trpc-client` a factory function.

## Target file tree

Unchanged.

```
packages/agenda/src/
  reconcile.ts
  build-update-plan.ts
  analytics.ts
  schemas.ts
  types.ts
  constants.ts
  index.ts
```

## How this fits with `apps/addins`'s `lib/sync-agenda.ts` — resolved, does NOT move to `office-js`

Read in full (previously flagged as "verify before moving"): `apps/addins/assets/src/lib/sync-agenda.ts` calls only `@deck-pack/agenda`'s pure helpers (`buildConfigurationHash`, `buildAnalyticsMetadata`, `queuePendingEvent`, `markEventSynced`) plus `AgendaStore.sync()` (a tRPC-backed store from `@/services/types`). It contains **zero** Office.js calls and never touches `packages/office-js/src/agenda/`'s `scan-agenda-deck.ts`/`apply-agenda-update.ts` — those are called from elsewhere in the add-in (e.g. `pages/agenda/agenda-page.tsx`, `components/agenda/editor/agenda-editor.tsx`), not from this file.

So the original hypothesis was wrong: this isn't "adapt a pure computation result onto a live PowerPoint document" (that's `office-js/src/agenda/`'s job, and it's already there). `sync-agenda.ts` is "take an already-computed config and push/pull it to/from the cloud store" — orchestration between the pure package and the backend, with no Office.js involved. It correctly stays app-local in `apps/addins` (or migrates into `packages/hooks` alongside the future `AgendaStore` implementation, following the centralized-hooks pattern in `packages/hooks.md`, since its only real dependency besides pure logic is the store) — either way, it does **not** belong inside `packages/office-js`.

## Design patterns implemented here, and what each solves

None deliberately — this package is intentionally pattern-free pure logic, which is itself the correct choice per the package-taxonomy principle in `00-conventions-and-architecture.md` §8.1: not forcing structure where a plain function already does the job clearly.

## Migration order

None for this package directly. Revisit only as a side effect of the `apps/addins` hook/lib audit (`apps/addins.md`), which may relocate `sync-agenda.ts`-style glue into `packages/office-js/src/agenda/`.
