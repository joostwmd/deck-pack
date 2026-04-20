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

The server env uses a single `CORS_ORIGIN`. For local multi-app testing, point all frontends at the same API URL (`VITE_SERVER_URL`) and expand `CORS_ORIGIN` / Better Auth `trustedOrigins` when you need multiple browser origins in parallel.

## Cloud deployment

The current Terraform stacks (`terraform/stacks/*`) deploy the API via a Docker container on **Azure App Service (Linux, B1)** and were originally set up to also run the OPS frontend the same way. That is **not** the intended production target — it's a stepping-stone used to prove out the ACR + OIDC + container pull pipeline end-to-end.

**Intended target architecture** (do not regress from this):

- **Frontends (`apps/ops`, `apps/portal`, `apps/addins/*`) → Azure Static Web Apps.** Static Vite builds ship straight to SWA's global CDN. No Docker image, no container registry path, no App Service plan charge. Free tier covers 100GB bandwidth/month and includes TLS + custom domains. Geo-distribution happens automatically at the edge; public static assets are not a personal-data path, so residency concerns stay with the API and DB tier.
- **Backend (`apps/api`) → Azure App Service B1 (Linux, custom container).** Hono isn't supported by SWA's managed API slot, so the container path stays. B1 is the cheapest SKU that supports custom Linux containers. Can be swapped for Azure Container Apps later for scale-to-zero economics without changing the Docker image.

**Why this split matters:**

- **Cost**: B1 for OPS is ~€13/month flat; SWA Free is €0.
- **Scaling**: SWA autoscales and edge-caches automatically; App Service Basic doesn't autoscale at all (needs Standard+).
- **Geo**: SWA distributes assets globally out of the box; multi-region API deployment still requires Front Door in front of regional App Service/Container Apps instances, and that's where residency controls belong.

When moving frontends to SWA:

1. Drop them from `terraform/stacks/app-service` (the OPS web app + AcrPull role).
2. Add a new stack (`terraform/stacks/static-web-apps/` or similar) with `azurerm_static_web_app` per frontend.
3. Replace the OPS build-and-push job in `.github/workflows/build-and-push.yml` with `Azure/static-web-apps-deploy@v1` pointing at each frontend's `dist/` folder.
4. Keep the API container pipeline exactly as it is — the split is clean.

## Tooling

- **Turborepo** — `turbo.json`
- **Oxlint + Oxfmt** — `pnpm check`
- **Lefthook** — optional git hooks (`lefthook.yml`)

## Template

Initial structure was adapted from Better-T-Stack (`my-better-t-app/`). You can delete that folder once you no longer need the reference.
