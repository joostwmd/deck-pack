# `packages/env` and `packages/config` — infra packages, no change needed

Kind: **infra**, minimal by design. Both packages are correctly small and stay that way — flagged explicitly as "leave as-is" during the architecture discussion.

## Current state (confirmed)

```
packages/env/src/
  web.ts          — validated client-side env vars (import.meta.env / VITE_* — zod-parsed)
  server.ts         — validated server-side env vars (process.env — zod-parsed)

packages/config/
  package.json
  tsconfig.base.json    — shared TypeScript compiler options, extended by every app/package's own tsconfig.json
```

## Why these need no restructuring

- `packages/env` is already exactly as minimal as an env-validation package should be: two files, one per runtime target (`web`/`server`), each presumably exporting a single validated, typed `env` object built with `zod.parse(process.env)`/`zod.parse(import.meta.env)`. There's no port to define (there's nothing to swap — env vars aren't mocked, they're just read once at boot) and no business logic.
- `packages/config` is tooling configuration, not application code — a `tsconfig.base.json` and its `package.json`. It's consumed via TypeScript's `extends`, not via JS imports, so none of the module-boundary/DI conventions in this refactor apply to it at all.

Growing either package (e.g. adding an `eslint-config` sibling file, or a shared `vitest.config.base.ts`) is fine and expected as the monorepo grows, but that's incremental addition, not the kind of structural rework this refactor is doing elsewhere.

## Target file tree

Unchanged for both.

## Design patterns implemented here, and what each solves

None — deliberately minimal, config/bootstrapping code rather than business logic. No pattern is being retrofitted onto either package.

## Migration order

None.
