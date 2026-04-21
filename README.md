# DeckPack

PowerPoint add-ins and dashboards sharing one **Hono + tRPC** API (`apps/api`), **Drizzle + Postgres**, and **Better Auth**.

Monorepo layout:

```
apps/
  api/              # Hono + tRPC + LogTape; `src/transport/`, `src/api/`, `src/domains/`
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

TanStack Router generates `src/routeTree.gen.ts` during `vite build` / dev; the file is gitignored—run `pnpm dev` or a Vite build (e.g. `pnpm check-types` in an app) before `tsc` alone if the file is missing.

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

The server env uses `CORS_ORIGINS`: a **comma-separated** list of allowed browser origins (same values are used for CORS and Better Auth `trustedOrigins`). Example for two local Vite apps:

`CORS_ORIGINS=http://localhost:3001,http://localhost:3002`

## Cloud deployment

Terraform lives under `terraform/envs/` (see `terraform/README.md`).

**Architecture**

- **Frontends** (`apps/ops`, `apps/portal`, `apps/addins/assets`) → **Azure Static Web Apps** (`terraform/envs/<env>/static-web-apps/`). Vite `dist/` is deployed by `.github/workflows/deploy-static-web-apps.yml` using each SWA’s deployment token (GitHub Actions secrets).
- **Backend** (`apps/api`) → **Azure App Service (Linux, custom container from ACR)** (`terraform/envs/<env>/app-service/`). Built and pushed by `.github/workflows/build-and-push.yml` (API image only).

After `terraform apply` on `static-web-apps`, copy each sensitive `*_deployment_token` output into GitHub secrets: `SWA_TOKEN_OPS_PROD`, `SWA_TOKEN_PORTAL_PROD`, `SWA_TOKEN_ASSETS_PROD` (and staging equivalents when you bring staging up).

## Tooling

- **Turborepo** — `turbo.json`
- **Oxlint + Oxfmt** — `pnpm check`
- **Lefthook** — optional git hooks (`lefthook.yml`)

## Template

Initial structure was adapted from Better-T-Stack (`my-better-t-app/`). You can delete that folder once you no longer need the reference.
