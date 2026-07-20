# DeckPack

Capstone monorepo: a **PowerPoint add-in** experience, **customer portal**, and **internal operations** app backed by one **Hono + tRPC** API, **Drizzle + PostgreSQL**, and **Better Auth**. The project is structured to show how **cloud computing**, **continuous delivery**, **containerization**, and **infrastructure-as-code** work together to run and evolve software reliably on **Microsoft Azure**.

---

## Module context: cloud computing and continuous delivery

Cloud computing and continuous delivery have converged into a practical discipline: **operating software reliably and securely while the software itself keeps changing**. On-demand resources from public cloud providers, **container images** that stay consistent from laptop to production, and **declarative infrastructure** (describing environments as versioned code rather than manual clicks) sit at the center of that approach.

This repository is both an application codebase and a **delivery story**:

- **Azure PaaS** runs the workloads (Static Web Apps for Vite frontends, App Service for the containerized API, managed PostgreSQL, Key Vault, Storage, Azure Container Registry).
- **Terraform** under `terraform/` expresses infrastructure as reusable modules and per-environment stacks; **state** lives in **Azure Blob** (bootstrapped with `./scripts/bootstrap-tfstate.sh`).
- **GitHub Actions** implements pipelines: automated tests and builds on pull requests, coordinated deploys to **staging** on branch push, and a **manual** production release so API and frontends stay aligned.
- **OIDC federation** from GitHub to Azure avoids long-lived cloud secrets in CI; the API reads runtime secrets via **Key Vault references** and **managed identity**.

The sections below tie that narrative to this repo: diagrams, deployed URLs, layout, local development, IaC layout, and CI/CD behavior.

---

## Contents

- [Module context: cloud computing and continuous delivery](#module-context-cloud-computing-and-continuous-delivery)
- [Contents](#contents)
- [Architecture](#architecture)
- [CI/CD](#cicd)
- [Deployed URLs (production and staging)](#deployed-urls-production-and-staging)
- [Repository structure](#repository-structure)
- [Prerequisites](#prerequisites)
- [Local setup and development](#local-setup-and-development)
- [Infrastructure as code (Terraform)](#infrastructure-as-code-terraform)
- [Continuous delivery (GitHub Actions)](#continuous-delivery-github-actions)
- [Security and operations highlights](#security-and-operations-highlights)
- [Tooling](#tooling)

---

## Architecture

**Diagram:** [architecture.pdf](./diagrams/architecture.pdf) — place your PDF in `diagrams/` with this name (or edit the link).

**Narrative (short):**

- **Browsers** load three **Azure Static Web Apps** frontends (`apps/ops`, `apps/portal`, `apps/addins/assets`). Each talks to the **API** over HTTPS with CORS and Better Auth **trusted origins** derived from Terraform outputs—not hand-maintained lists.
- The **API** (`apps/api`) runs as a **Linux container** on **Azure App Service**; images are built from `docker/api.Dockerfile` and stored in **ACR**. The same image pattern applies to staging and production; tags distinguish environments (`:staging`, `:latest`, and immutable `:<sha>`).
- **Data**: **Azure Database for PostgreSQL – Flexible Server**. **Secrets**: **Key Vault** (`DATABASE_URL`, `BETTER_AUTH_SECRET`, email provider secrets) referenced from App Service app settings. **Blob storage** holds uploads; the API uses **managed identity** and **user delegation SAS**, not storage account keys.
- **Shared foundation**: one **resource group / ACR** pattern under `terraform/envs/shared/foundation`; **GitHub OIDC** identity is provisioned from `terraform/envs/shared/ci-identity`. **Terraform state** is isolated in a dedicated state resource group with versioning and soft delete.

Optional **Azure Front Door** code exists under `terraform/modules/front-door` and `terraform/envs/prod/front-door` for edge + WAF patterns; student or trial subscriptions may block applying Front Door until the subscription type allows it.

---

## CI/CD

**Diagram:** [cicd.pdf](./diagrams/cicd.pdf) — place your PDF in `diagrams/` with this name (or edit the link).

**Narrative (short):**

- **Pull requests to `staging`**: `.github/workflows/pull-request-ci.yml` runs the reusable test suite (`test-suite.yml`), lint, typecheck, and a local validation build of the API Docker image (no push). Heavy checks intentionally do not re-run on the promotion PR from `staging` → `main` once staging has already been exercised.
- **Push to `staging`**: `.github/workflows/staging-deploy.yml` runs tests again, then a **two-phase** rollout: parallel builds (API image push to ACR + Static Web App build artifacts), then parallel deploy (API restart + SWA uploads) so staging backend and frontends move together.
- **Production**: `.github/workflows/production-deploy.yml` is **manual** (`workflow_dispatch`). Run it from the branch/commit that should be live (typically `main`). It follows the same two-phase pattern for prod tokens and prod App Service.
- **Promotion rule**: `.github/workflows/pull-request-main-branch-rules.yml` enforces that pull requests **into `main`** use **`staging` as the head branch**, so `main` records promoted code. Repository rulesets for `main` and `staging` are managed in Terraform under `terraform/envs/shared/github-governance/` (branch protection behaviour—configure required status checks in the GitHub UI where needed so check names stay accurate).

Jobs that touch Azure use **`azure/login`** with **OIDC** and GitHub **Environments** named `staging` and `prod`, matching federated credentials created by the `ci-identity` module.

---

## Deployed URLs (production and staging)

Public HTTPS entry points for the four applications on Azure Static Web Apps (frontends) and Azure App Service (API).

| Application | Role                                                      | Production                                                                                                     | Staging                                                                                                      |
| ----------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Ops**     | Internal operations dashboard (Static Web App)            | [https://blue-stone-00d228c03.7.azurestaticapps.net/](https://blue-stone-00d228c03.7.azurestaticapps.net/)     | [https://orange-bay-0bf467703.7.azurestaticapps.net/](https://orange-bay-0bf467703.7.azurestaticapps.net/)   |
| **Portal**  | Organization admin dashboard (Static Web App)             | [https://white-wave-0cfaad503.7.azurestaticapps.net/](https://white-wave-0cfaad503.7.azurestaticapps.net/)     | [https://blue-hill-0434a2003.7.azurestaticapps.net/](https://blue-hill-0434a2003.7.azurestaticapps.net/)     |
| **Add-in**  | DeckPack add-in web shell / Static Web App                | [https://lively-coast-020399703.7.azurestaticapps.net/](https://lively-coast-020399703.7.azurestaticapps.net/) | [https://yellow-tree-08cc84803.7.azurestaticapps.net/](https://yellow-tree-08cc84803.7.azurestaticapps.net/) |
| **API**     | Hono + tRPC + Better Auth (App Service – Linux container) | [https://deck-pack-api-jw.azurewebsites.net/](https://deck-pack-api-jw.azurewebsites.net/)                     | [https://deck-pack-api-staging-jw.azurewebsites.net/](https://deck-pack-api-staging-jw.azurewebsites.net/)   |

---

## Repository structure

```
apps/
  api/              # Hono + tRPC API (container image for App Service)
  ops/              # Internal operations dashboard (Vite)
  portal/           # Organization admin dashboard (Vite)
  addins/assets/    # Add-in web app (Vite)
packages/
  db/               # Drizzle schema, migrations, local Docker Compose for Postgres
  auth/             # Better Auth configuration
  env/              # @t3-oss/env (server + Vite)
  ui/               # Shared UI components
  config/           # Shared TypeScript config
terraform/
  modules/          # Reusable Azure modules (foundation, ci-identity, database, …)
  envs/             # Per-environment roots (shared, prod, staging) + remote state keys
diagrams/           # architecture.pdf, cicd.pdf (see links in Architecture / CI/CD sections)
```

TanStack Router in the Vite apps generates `routeTree.gen.ts` during `vite build` / dev; if the file is missing, run `pnpm dev` or a Vite build for that app before relying on `tsc` alone.

---

## Prerequisites

- **Node.js** 20+ (or 22+)
- **pnpm** 10 ([Corepack](https://nodejs.org/api/corepack.html) or `npm i -g pnpm`)
- **Docker** (local Postgres via `packages/db/docker-compose.yml`)
- **Azure CLI** (`az`) and **Terraform** (`terraform`) when working with `terraform/` and `scripts/bootstrap-tfstate.sh`

---

## Local setup and development

```bash
pnpm install
cp .env.example apps/api/.env
cp apps/ops/.env.example apps/ops/.env
# Optional: copy .env examples for portal and add-in apps if you use them locally
```

Fill **`apps/api/.env`** with email delivery settings if you use OTP sign-in: **`EMAIL_API_KEY`** and **`EMAIL_FROM`** ([Resend](https://resend.com) or your provider as configured). There is no mock email sender in development for production parity paths.

Start Postgres and apply schema:

```bash
pnpm db:start
pnpm db:push
```

**Integration tests** (`pnpm test:integration`) expect Postgres on **`DATABASE_URL`** (defaults align with `packages/db/docker-compose.yml`). If Docker is not up yet, use `pnpm test:integration:with-db` or start `pnpm db:start` first, then `pnpm db:push`.

**Development servers:**

```bash
pnpm dev:api      # API — default http://localhost:3000 · tRPC http://localhost:3000/trpc
pnpm dev:ops      # Ops — typically http://localhost:3001
pnpm dev:portal   # Portal — Vite port 3002
pnpm dev:assets   # Add-in assets — HTTPS Vite port 3003
```

**CORS and auth:** set **`CORS_ORIGINS`** on the API to a **comma-separated** list of browser origins (same list feeds Better Auth **trusted origins**), for example:

`CORS_ORIGINS=http://localhost:3001,http://localhost:3002,https://localhost:3003`

`CORS_ORIGINS=http://localhost:3001,http://localhost:3002,https://localhost:3003`

### Microsoft SSO (web vs Office add-in)

The assets add-in uses **two Microsoft sign-in strategies**:

| Context | Strategy | Session transport |
| ------- | -------- | ----------------- |
| Browser preview (`/web/*`) | Better Auth redirect OAuth | HTTP-only cookies |
| Office taskpane with NAA | MSAL Nested App Authentication → Better Auth `signIn.social({ idToken })` | In-memory Better Auth bearer token |
| Office without NAA | Microsoft button disabled; use email OTP | In-memory bearer token after OTP |

**Entra app registration (single application):**

1. Copy **Application (client) ID** into API `MICROSOFT_CLIENT_ID` and add-in `VITE_MICROSOFT_CLIENT_ID` (same value).
2. Create a **client secret** for the API only (`MICROSOFT_CLIENT_SECRET`).
3. Under **Authentication**, add redirect URIs:
   - **Web:** `http://localhost:3000/api/auth/callback/microsoft` (dev) and `https://<api-host>/api/auth/callback/microsoft` (prod). Must match `BETTER_AUTH_URL`.
   - **SPA (NAA broker):** `brk-multihub://localhost:3003` and `brk-multihub://<addin-host>` (origin only, no path).
   - **SPA (PowerPoint on the web):** `https://localhost:3003/index.html` and `https://<addin-host>/index.html`.
4. Under **API permissions**, add Microsoft Graph delegated **`User.Read`**.
5. Under **Token configuration**, add optional ID token claim **`email`** (or rely on `preferred_username` mapping).

**Local add-in env** (`apps/addins/assets/.env`):

```env
VITE_SERVER_URL=https://localhost:3003
VITE_MICROSOFT_CLIENT_ID=<same-as-MICROSOFT_CLIENT_ID>
```

### PowerPoint add-in sideloading

Manifests live in `apps/addins/assets/manifests/` (dev, staging, prod). Sideload scripts use Microsoft's `office-addin-debugging` CLI.

**Local dev** (two terminals):

```bash
pnpm dev:assets        # Terminal 1 — HTTPS dev server at https://localhost:3003
pnpm sideload:assets   # Terminal 2 — register dev manifest + launch PowerPoint
```

**Test against deployed builds** (no local Vite needed):

```bash
pnpm sideload:assets:staging   # sideload against staging SWA
pnpm sideload:assets:prod      # sideload against production SWA
```

**Other commands:**

```bash
pnpm -F @deck-pack/assets sideload:stop      # stop dev sideload
pnpm -F @deck-pack/assets validate           # validate dev manifest
pnpm -F @deck-pack/assets validate:staging   # validate staging manifest
pnpm -F @deck-pack/assets validate:prod      # validate prod manifest
```

**First-time HTTPS certs** (auto-installed on first `pnpm dev:assets`; manual fallback):

```bash
npx office-addin-dev-certs install
```

**Stale sideload cache** (if the add-in does not update):

- macOS: `~/Library/Containers/com.microsoft.Powerpoint/Data/Documents/wef`
- Windows: `%LOCALAPPDATA%\Microsoft\Office\16.0\Wef\`

`dev:addin-one` is an alias for `dev:assets`.

---

## Infrastructure as code (Terraform)

- **Layout:** `terraform/modules/` holds reusable HCL. `terraform/envs/<shared|prod|staging>/<stack>/` are thin roots; each stack has its **own remote state key** in Azure Blob.
- **Bootstrap state:** run `./scripts/bootstrap-tfstate.sh` once. It creates the isolated state resource group, storage account (Entra-only access, versioning, soft delete), and `tfstate` container documented in-repo for recoverability.
- **Typical cold-start apply order:**  
  `shared/foundation` → `shared/ci-identity` → per-environment `database` → `key-vault` → `static-web-apps` → `app-service` → optional `storage` (then set `wire_storage = true` on app-service and re-apply) → optional `front-door` for prod when subscription allows.
- **Cross-stack wiring:** stacks read each other via **`terraform_remote_state`** (for example, `app-service` consumes SWA URLs for **`CORS_ORIGINS`** and Key Vault secret URIs). **Staging stacks cannot read prod state keys** by design—each environment uses its own state namespace.
- **Secrets:** database URL and auth secrets are **written to Key Vault** during the key-vault stack; App Service holds **Key Vault reference** app settings resolved at runtime with **managed identity**. **Do not** commit real `terraform.tfvars` with secrets. Email provider variables for Key Vault are often passed with **`TF_VAR_email_api_key`** / **`TF_VAR_email_from`** or sourced from a gitignored tfvars file.
- **Static Web Apps:** Terraform outputs **deployment tokens** as sensitive outputs; map them to GitHub Actions secrets for SWA upload steps.
- **Convenience:** root `package.json` exposes `pnpm tf:init:*`, `pnpm tf:plan:*`, and `pnpm tf:apply:*` for each stack—see that file for the full matrix.

---

## Continuous delivery (GitHub Actions)

| Workflow                                 | When                              | Purpose                                                                            |
| ---------------------------------------- | --------------------------------- | ---------------------------------------------------------------------------------- |
| **`test-suite.yml`**                     | Called by other workflows         | Unit tests + Postgres-backed integration tests (schema push + Vitest).             |
| **`pull-request-ci.yml`**                | PRs targeting **`staging`**       | Test suite, lint, typecheck, monorepo build, Docker build of API **without** push. |
| **`pull-request-main-branch-rules.yml`** | PRs targeting **`main`**          | Ensures the head branch is **`staging`**; no duplicate heavy CI on promotion.      |
| **`staging-deploy.yml`**                 | Push to **`staging`** (or manual) | Test gate → parallel builds → parallel deploy (API to staging + staging SWAs).     |
| **`production-deploy.yml`**              | **Manual** dispatch               | Same two-phase pattern for **production** API + Static Web Apps.                   |

**Identity:** workflows that deploy use **`azure/login`** with **OIDC** tied to GitHub **Environments** **`staging`** and **`prod`**, matching Entra **federated credentials** from `ci-identity`.

**Rollback (API):** pin the image tag in Terraform (`api_image_tag` / equivalent in your `terraform.tfvars`) to a previous short SHA that still exists in ACR, then `terraform apply` for that stack so App Service pulls the older digest.

---

## Security and operations highlights

- **Shared responsibility:** Azure patches PaaS runtimes; this repo owns application code, TLS/`https_only`, CORS, identity integration, and data handling.
- **No storage account keys in app settings:** uploads use **managed identity** and **short-lived SAS** where applicable.
- **No long-lived Azure client secrets in GitHub for deploy:** prefer **OIDC** + federated credentials scoped per environment.
- **Least privilege:** API managed identity receives **Key Vault Secrets User** (not admin) and **AcrPull** where needed.
- **Observability:** structured logs from the API (e.g. LogTape → stdout) integrate with App Service log streaming; expand to Application Insights or similar for metrics and alerting as the module evolves.

---

## Tooling

- **Turborepo** — `turbo.json`
- **Oxlint + Oxfmt** — `pnpm check`
- **Lefthook** — optional git hooks (`lefthook.yml`)
