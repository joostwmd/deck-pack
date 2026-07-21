# deck-pack refactor documentation

This folder is the frozen record of the architecture decisions made before starting the OOP/hexagonal refactor. Nothing here is implemented yet. Read in this order:

1. **[`00-conventions-and-architecture.md`](./00-conventions-and-architecture.md)** — the "why" and "how": naming conventions, layered architecture, boundaries/linting strategy, package taxonomy, testing/DI strategy, the full pattern glossary (Repository, Port/Adapter, Use Case, Strategy, Command, Builder, Factory function, Saga, Unit of Work), and tRPC guard naming/layout (§12). Read this first, always.
2. **[`01-target-structure.md`](./01-target-structure.md)** — the "where": full destination file tree for every app and package, plus old → new mapping tables (packages, frontend "features" → "domains", the DB rename). Includes an explicit open-questions section for the two naming collisions (`agenda`, `shortcuts`) that need resolving during implementation, not guessing now.
3. **Per-app details** (`apps/`):
   - [`apps/api.md`](./apps/api.md) — becomes the thinnest layer; domain logic moves to packages, `AppContainer`, `ApiAppBuilder`; `api/` → `trpc/` rename with guards split into `middleware/`+`assertions/` (see 00-conventions §12).
   - [`apps/portal.md`](./apps/portal.md), [`apps/ops.md`](./apps/ops.md) — `features/` → `domains/`+`pages/`; panels stay app-local, views/hooks become shared.
   - [`apps/addins.md`](./apps/addins.md) — lower priority, needs a file-by-file audit before moving anything (flagged explicitly, not fabricated).
4. **Per-package details** (`packages/`), roughly in migration order:
   - [`packages/organization.md`](./packages/organization.md) — **read this one first**, it's the reference template every other domain package follows.
   - [`packages/gallery.md`](./packages/gallery.md) — the `library`→`gallery` rename (including a DB migration) + the Saga pattern worked example.
   - [`packages/logos.md`](./packages/logos.md), [`packages/photos.md`](./packages/photos.md), [`packages/icons.md`](./packages/icons.md) — the integration-port pattern (Brandfetch/Pexels/Noun Project), plus an `Icons8Client` dead-code cleanup.
   - [`packages/domain-template.md`](./packages/domain-template.md) — how the template applies to every remaining backend domain (`members`, `seats`, `billing`, `users`, `brand-profiles`, `flags`, `shapes`, `slides`, `system`, `assets`, `addin`, plus the two renamed-for-collision domains), with an explicit call-out that `gallery`/`flags`/`shapes`/`slides` may overlap and shouldn't all become separate packages without checking first.
   - [`packages/db.md`](./packages/db.md) — the `tx` Proxy → `UnitOfWork` class rewrite; how 62 query files collapse into per-domain Repositories.
   - [`packages/auth.md`](./packages/auth.md) — already the model for the Strategy + factory-function pattern; minimal changes.
   - [`packages/storage.md`](./packages/storage.md) — already the model Port/Adapter; one naming-only change (factory functions → classes).
   - [`packages/observability.md`](./packages/observability.md) — adds a `server/` subpath mirroring the existing `browser/` one; `ErrorReporter`/`RequestMonitoring` as separate interfaces, each with a factory function and a `Noop*`.
   - [`packages/integrations.md`](./packages/integrations.md) — already mostly correct raw-SDK wrappers; explains why there's no shared port across providers, and flags `icons8/` for deletion.
   - [`packages/brand-compliance.md`](./packages/brand-compliance.md) (renamed from `presentation-check`), [`packages/shape-commands.md`](./packages/shape-commands.md) (renamed from `presentation-formatting`), [`packages/office-js.md`](./packages/office-js.md) — the Command-pattern fix for `apply-finding-fix.ts`'s `switch` statement, and why the two packages stay separate rather than merging.
   - [`packages/ui.md`](./packages/ui.md), [`packages/hooks.md`](./packages/hooks.md) — the new centralized frontend layer that removes the "should this be shared" judgment call; supersedes `packages/library-admin`.
   - [`packages/trpc-client.md`](./packages/trpc-client.md), [`packages/agenda.md`](./packages/agenda.md), [`packages/shortcuts.md`](./packages/shortcuts.md), [`packages/env-and-config.md`](./packages/env-and-config.md) — lowest priority, documented for completeness; these are already correctly minimal and need no structural change.

## What this documentation deliberately does NOT do

Several backend domains (`addin`, `assets`, `system`, and the overlap question between `gallery`/`flags`/`shapes`/`slides`) were not read in depth during the architecture discussion. Rather than fabricate confident specifics for code that wasn't inspected, those sections say so explicitly and give an audit checklist instead of invented implementation detail. Do the audit before writing code for those specific domains — everywhere else in this folder is grounded in real, confirmed file contents.
