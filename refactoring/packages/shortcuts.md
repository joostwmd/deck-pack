# `packages/shortcuts` — pure computation package, no change needed

Kind: pure computation library, same reasoning as `packages/agenda.md`. Lowest priority; documented for completeness, not being restructured.

**Naming note:** disambiguate this from the backend `shortcuts` domain in `apps/api/src/domains/shortcuts/` (DB-backed, persists user shortcut overrides) — see `01-target-structure.md` §5 for the proposed rename of the backend domain to `packages/shortcut-overrides` to avoid a name collision. This package (`packages/shortcuts`) keeps its name.

## Current state (confirmed)

```
packages/shortcuts/src/
  definitions.ts     — the catalog of available keyboard shortcuts and their default bindings
  hotkey.ts            — hotkey string parsing/formatting (e.g. "Cmd+Shift+K")
  resolver.ts           — resolves a pressed key combination to a bound action, respecting user overrides
  migrations.ts
  schemas.ts
  constants.ts
  index.ts
```

## Why this stays functional

Same reasoning as `packages/agenda.md`: `resolver.ts`'s job is "given a key combination and a set of bindings, return the matching action" — a pure lookup/matching function, with no state worth encapsulating in a constructor and no polymorphism requirement. `migrations.ts` (likely: schema-version migrations for a user's locally-stored shortcut binding overrides, distinct from `packages/db`'s SQL migrations) is worth a second look to confirm it's genuinely local-storage/client-side versioning and not something that actually belongs paired with the backend `shortcut-overrides` domain's persistence layer — read it before assuming it stays here unchanged.

## Target file tree

Unchanged, pending the `migrations.ts` check above.

```
packages/shortcuts/src/
  definitions.ts
  hotkey.ts
  resolver.ts
  migrations.ts
  schemas.ts
  constants.ts
  index.ts
```

## No Office.js counterpart — confirmed, not just assumed

Unlike `agenda` (which has real Office.js-specific glue in `packages/office-js/src/agenda/`), `packages/shortcuts` has **no** Office.js footprint anywhere, and none should be created for it — confirmed by grep, `packages/office-js` has no `shortcuts/` subfolder and no dependency on `@deck-pack/shortcuts` in its `package.json`. Keybinding capture (`keydown` listeners) and hotkey display formatting are DOM/React concerns handled entirely in `apps/addins`; nothing about resolving "which action does Ctrl+K map to" touches the PowerPoint object model. This is the concrete evidence behind the package-taxonomy decision in `00-conventions-and-architecture.md` §8.4 — Office.js adapter code doesn't get created symmetrically for every domain, only where it's actually needed.

## How this fits with `apps/addins`'s shortcut-related files

`apps/addins/assets/src/lib/shortcuts.ts`, `lib/powerpoint-shortcuts.ts`, `lib/hotkey-display.ts`, `providers/shortcut-bindings-provider.tsx`, and the flat `hooks/use-resolved-shortcut-defs.ts`/`use-shortcut-commands.ts`/`use-navigation-hotkeys.ts`/`use-*-hotkeys.ts` files are all very likely consumers of this package's `resolver`/`definitions`/`hotkey` exports — per `apps/addins.md`'s audit checklist, these are Office/canvas UI-controller hooks (stay app-local, reorganized into a `hooks/shortcuts/` subfolder) rather than candidates for `packages/hooks` (which is for backend-data hooks only). `use-shortcut-commands.ts` was flagged in `apps/addins.md` as a possible business-data-hook candidate specifically because "commands" suggests it might call the backend `shortcut-overrides` domain (persisted user overrides) rather than just resolving local keybindings — read it to confirm which bucket it's actually in.

## Design patterns implemented here, and what each solves

None deliberately — same as `packages/agenda.md`, intentionally pattern-free pure logic.

## Migration order

None for this package directly. Revisit only as a side effect of the `apps/addins` hook/lib audit (`apps/addins.md`).
