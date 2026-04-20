# DeckPack

PowerPoint add-ins and dashboards sharing one **Hono + tRPC** API (`apps/api`), **Drizzle + Postgres**, and **Better Auth**.

Monorepo layout:

```
apps/
  api/              # Hono server + tRPC routers (@deck-pack/api)
  ops/              # Internal operations dashboard
  portal/           # Organization admin dashboard
  addins/
    addin-one/      # Example add-in web app
packages/
  db/               # Drizzle schema, migrations, docker compose
  auth/             # Better Auth
  env/              # @t3-oss/env (server + Vite)
  ui/               # Shared shadcn-style components
  config/           # Shared TypeScript base
```

## Prerequisites

- Node 20+ (or 22+)
- pnpm 10 ([Corepack](https://nodejs.org/api/corepack.html) or `npm i -g pnpm`)
- Docker (for local Postgres via `packages/db/docker-compose.yml`)

TanStack Router generates `src/routeTree.gen.ts` during `vite build` / dev; committed copies keep `pnpm check-types` working without a prior dev session.

## Setup

```bash
pnpm install
cp .env.example apps/api/.env
cp apps/ops/.env.example apps/ops/.env
# Optional: copy .env for portal and addins the same way
```

Start Postgres (from repo root):

```bash
pnpm db:start
```

Push schema (or use `db:migrate` after generating migrations):

```bash
pnpm db:push
```

## Development

Run API + internal dashboard (default CORS targets `http://localhost:3001`):

```bash
pnpm dev:api
pnpm dev:ops
```

Other apps:

- Organization dashboard: `pnpm dev:portal` (Vite port **3002**)
- Example add-in web: `pnpm dev:addin-one` (Vite port **3003**)

API: `http://localhost:3000` · tRPC: `http://localhost:3000/trpc`

### Multi-app CORS / auth

The server env uses a single `CORS_ORIGIN`. For local multi-app testing, point all frontends at the same API URL (`VITE_SERVER_URL`) and expand `CORS_ORIGIN` / Better Auth `trustedOrigins` when you need multiple browser origins in parallel.

## Tooling

- **Turborepo** — `turbo.json`
- **Oxlint + Oxfmt** — `pnpm check`
- **Lefthook** — optional git hooks (`lefthook.yml`)

## Template

Initial structure was adapted from Better-T-Stack (`my-better-t-app/`). You can delete that folder once you no longer need the reference.
