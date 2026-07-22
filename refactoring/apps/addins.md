# `apps/addins/assets` — detailed refactor plan

Reference: `00-conventions-and-architecture.md` §5. **Caveat up front:** this app's internals were not inspected file-by-file during the architecture discussion (unlike `api`/`portal`/`ops`, which were read in depth). What follows is grounded in the actual current file tree (confirmed via listing) plus the conventions established for the rest of the monorepo, but the hook-by-hook and lib-by-lib classification below needs a dedicated pass before you start moving files — don't apply it mechanically without re-checking each file's actual content first.

## Current state (confirmed file tree)

```
apps/addins/assets/src/
  auth/                    (bearer-session-store.ts, create-addin-sign-out-strategy.ts, naa-support.ts,
                             office-auth-mode.ts, restore-office-session.ts, session-continuity-store.ts)
  components/
    agenda/ asset-browser/ check/ flags/ format/ harvey-balls/ icons/ logos/ photos/ shapes/ shell/ shortcuts/ slides/ themes/
  constants/ (navigation.ts)
  contexts/ (EnvironmentContext.tsx, OfficeContext.tsx, web-canvas-context.tsx)
  features/usage/
  hooks/                   (~24 hooks, flat — use-asset-insertion, use-asset-search*, use-brand-profiles,
                             use-canvas-download-button-controller, use-check-panel-controller, use-format-panel-controller,
                             use-harvey-balls-panel-controller, use-navigation-hotkeys, use-office-detection,
                             use-photo-search*, use-powerpoint-selection, use-shape-library*, use-shortcut-commands,
                             use-slide-search*, ...)
  lib/                     (~18 files — canvas-item-src, canvas-position, download-presentation, fetch-file-as-base64,
                             get-default-command-params, harvey-ball-svg, hotkey-display, insert-asset, insert-harvey-ball,
                             insert-slide, insertion-strategy, powerpoint-shortcuts, route-environment,
                             run-formatting-command, run-presentation-check, shortcuts, sync-agenda, track-asset-insertion,
                             url-to-base64, user-facing-api-error, user-initials)
  pages/                   (agenda/ check/ flags/ format/ harvey-balls/ icons/ logos/ photos/ shapes/ shortcuts/ slides/ themes/)
  providers/ (app-hotkeys-provider.tsx, shortcut-bindings-provider.tsx)
  routes/ (__root.tsx, _protected/, auth.callback.tsx, index.tsx, login.tsx)
  services/ (app-services.ts, services-context.tsx, types.ts)
  types/ (asset-types.ts)
  utils/ (auth.ts, trpc.ts)
  main.tsx, router-register.ts, routeTree.gen.ts
```

## What's notable, compared to `portal`/`ops`

- **This app already uses `pages/` naming**, and its `pages/*` map 1:1 to `components/*` (both organized by capability: `logos`, `photos`, `shapes`, `check`, `format`, ...). That's closer to our target convention than `portal`/`ops` currently are — good precedent to point at when doing the `features/` → `domains/`+`pages/` rename elsewhere.
- **`components/*` here is capability-organized, not domain-organized in the backend sense** — `check`, `format`, `harvey-balls` aren't backend bounded contexts, they're taskpane panels for distinct on-canvas tools. This is the same "capability-oriented adapter" shape `packages/office-js` already uses (see `00-conventions-and-architecture.md` §8.1) — appropriate here, not a smell, since the add-in's whole job is exposing Office.js capabilities through a UI.
- **`hooks/` is flat (24 files, no per-capability subfolders)** and **`lib/` is a grab-bag (18 files)** — same shape of problem `apps/api/src/lib` had. Needs sorting, not a blanket move.

## Classification needed before migrating (audit checklist)

For every hook in `hooks/` and every file in `lib/`, decide which bucket it's actually in — do this by reading each file, not by guessing from its name:

| Bucket                                                                                                                                 | Where it goes                                                                                                                                                             | How to recognize it                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Business/domain data hook** — fetches or mutates backend data via a Store, would be identical if `portal`/`ops` needed the same data | `packages/hooks/src/<domain>/`                                                                                                                                            | Calls `useServices()`/a Store method, wraps in `useQuery`/`useMutation`; candidates to check: `use-brand-profiles.ts`, `use-shortcut-commands.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **Office.js/canvas UI-controller hook** — orchestrates on-canvas interaction, Office.js state, or taskpane-panel-local state           | Stays in `apps/addins/assets/src/hooks/`, reorganized into per-capability subfolders matching `components/`/`pages/` (e.g. `hooks/shape-library/`, `hooks/photo-search/`) | Calls into `@deck-pack/office-js`, `PowerPoint.run`, or manages taskpane-panel-local UI state; likely candidates: `use-powerpoint-selection.ts`, `use-shape-library-controller.ts`, `use-asset-search-flow.ts`, all the `*-hotkeys.ts` files                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **Generic helper, no React**                                                                                                           | `apps/addins/assets/src/utils/` (renamed from `lib/`), or promoted to a package if genuinely reusable                                                                     | Pure functions on data — candidates: `canvas-position.ts`, `hotkey-display.ts`, `url-to-base64.ts`, `user-initials.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **Office.js command execution glue**                                                                                                   | Likely belongs in `packages/office-js` itself, not the app, if it's just "call an office-js function and adapt the result"                                                | Candidates: `run-formatting-command.ts`, `run-presentation-check.ts` — names strongly suggest thin wrappers around `@deck-pack/shape-commands`/`@deck-pack/brand-compliance` that arguably belong as adapters inside `packages/office-js` rather than app-local `lib/` files; **verify by reading each file** before moving. `sync-agenda.ts` is **resolved, does NOT move here** — read in full, it calls only `@deck-pack/agenda`'s pure helpers plus a tRPC-backed `AgendaStore.sync()`, zero Office.js calls (see `packages/agenda.md`'s "resolved" section) — it stays app-local orchestration, or migrates to `packages/hooks` alongside its Store, not `packages/office-js` |

## Target shape (pending the audit above)

```
apps/addins/assets/src/
  main.tsx
  routes/
  pages/                     — unchanged, already capability-organized correctly
  components/                — unchanged, already capability-organized correctly
  hooks/
    <capability>/            — reorganized from flat; office.js/canvas-controller hooks only
  domains/                    — NEW, only if the audit finds genuine backend-data hooks worth centralizing
    brand-profiles/
      brand-profiles-panel usage via @deck-pack/hooks, if promoted
  providers/
  contexts/
  utils/                       — renamed from lib/, generic helpers only after the audit above
  services/
  local/                        — escape hatch, same as portal/ops
  auth/                          — Office-specific auth strategies (bearer session, NAA support) — stays app-local,
                                    this is legitimately addin-only and not shared with portal/ops
```

## Design patterns already present here (keep, don't disturb)

| Pattern                | File(s)                                                                  | Problem solved                                                                                                                                                                                                                                                                                |
| ---------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Strategy**           | `auth/create-addin-sign-out-strategy.ts`                                 | Office add-in needs a different sign-out flow (bearer token + NAA cache clear) than the web apps; already implements `SignOutStrategy` from `packages/auth` — this is the existing precedent the whole factory-function convention (`00-conventions-and-architecture.md` §6.2) was modeled on |
| **Provider (Context)** | `contexts/OfficeContext.tsx`, `providers/shortcut-bindings-provider.tsx` | Exposes Office.js/hotkey state to the component tree without prop drilling                                                                                                                                                                                                                    |

## Migration order for this app

1. **Do the audit first** — read every file in `hooks/` and `lib/`, classify per the table above. Don't move anything until this is done; guessing from filenames alone risks moving Office.js-coupled code into `packages/hooks`, which must stay framework/business-data-only.
2. Rename `lib/` → `utils/` only after the audit has moved out anything that belongs elsewhere.
3. Reorganize `hooks/` into per-capability subfolders mirroring `pages/`/`components/` — this is a pure move, low risk, do it regardless of the audit's other findings.
4. Only after `packages/hooks` and `packages/office-js` exist with real content (from the `portal`/`ops`/`api` migrations), revisit whether any addin hook should be promoted — this app is lower priority than `api`/`portal`/`ops` precisely because so much of it is genuinely Office.js-specific and won't collapse into the shared packages the way `gallery` did.
