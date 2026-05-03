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

Fill in **Resend** in `apps/api/.env` (`RESEND_API_KEY` and `EMAIL_FROM`) using a [Resend](https://resend.com) API key and a sender you have verified. Email sign-in (OTP) uses Resend in **development and production**; there is no local mock sender.

Start Postgres (from repo root):

```bash
pnpm db:start
```

Push schema (or use `db:migrate` after generating migrations):

```bash
pnpm db:push
```

Integration tests (`pnpm test:integration`) need Postgres listening on `DATABASE_URL` (defaults match `packages/db/docker-compose.yml`). If Docker is not running yet, use `pnpm test:integration:with-db` (starts compose with `--wait`, then runs Vitest) or run `pnpm db:start` yourself, then ensure the schema is applied with `pnpm db:push`.

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

- **Frontends** (`apps/ops`, `apps/portal`, `apps/addins/assets`) → **Azure Static Web Apps** (`terraform/envs/<env>/static-web-apps/`). **Staging** deploys on push to **`staging`** via **`.github/workflows/staging-deploy.yml`** (with the API). **Production** builds run only when you execute **`.github/workflows/production-deploy.yml`** (manual, together with the API). See **`.github/workflows/README.md`**.
- **Backend** (`apps/api`) → **Azure App Service (Linux, custom container from ACR)**. **Staging** image is built in **`staging-deploy.yml`** on push to **`staging`**. **Production** image is part of the same **`production-deploy.yml`** manual run as the frontends.

After `terraform apply` on `static-web-apps`, copy each sensitive `*_deployment_token` output into GitHub secrets: `SWA_TOKEN_OPS_PROD`, `SWA_TOKEN_PORTAL_PROD`, `SWA_TOKEN_ASSETS_PROD` (and staging equivalents when you bring staging up).

## Tooling

- **Turborepo** — `turbo.json`
- **Oxlint + Oxfmt** — `pnpm check`
- **Lefthook** — optional git hooks (`lefthook.yml`)

## Template

Initial structure was adapted from Better-T-Stack (`my-better-t-app/`). You can delete that folder once you no longer need the reference.
