# Terraform

Azure infrastructure for deck-pack, organised as **reusable modules + per-environment roots**.

```
terraform/
  modules/          Reusable HCL bodies — no backend, no provider config
    foundation/       RG + ACR
    ci-identity/      Entra app + OIDC federated credentials for GitHub Actions
    database/         Postgres Flexible Server + firewall + generated admin password
    key-vault/        Key Vault + DATABASE_URL/BETTER_AUTH_SECRET/Resend EMAIL_* secrets
    static-web-app/   One Azure Static Web App (Vite frontends)
    app-service/      App Service Plan + API Linux Web App + AcrPull + Key Vault role assignments
    storage/          Blob Storage (LRS) + private uploads container + CORS + API MI blob RBAC
    front-door/       AFD profile + endpoints + origin groups + routes + WAF
  envs/             Per-environment roots — each has its own state file
    shared/           Cross-environment resources (one copy, both envs use)
      foundation/       → foundation.tfstate
      ci-identity/      → ci-identity.tfstate
    prod/             Production environment
      database/         → database.tfstate
      key-vault/        → prod-key-vault.tfstate
      static-web-apps/  → prod-static-web-apps.tfstate
      storage/          → prod-storage.tfstate
      app-service/      → app-service.tfstate
      front-door/       → prod-front-door.tfstate
    staging/          Staging environment (same shape as prod)
      database/         → staging-database.tfstate
      key-vault/        → staging-key-vault.tfstate
      static-web-apps/  → staging-static-web-apps.tfstate
      storage/          → staging-storage.tfstate
      app-service/      → staging-app-service.tfstate
```

Each env root is a thin wrapper that instantiates a module with env-specific
inputs — roughly 100 lines of boilerplate per stack that contains no logic.
All real HCL lives in `modules/`, so code changes propagate to every env at
once.

## How environments relate

```
                 ┌─────────────────┐
                 │ envs/shared/    │
                 │   foundation    │  RG, ACR        (single copy, both envs)
                 │   ci-identity   │  OIDC app       (single copy, both envs)
                 └────────┬────────┘
                          │ remote_state reads (acr_id, acr_login_server)
            ┌─────────────┴─────────────┐
            │                           │
  ┌─────────▼─────────┐      ┌──────────▼────────┐
  │ envs/prod/        │      │ envs/staging/     │
  │   database ───► key-vault│   database ───► key-vault
  │        │               │        │               │
  │        └──► static-web-apps     └──► static-web-apps
  │                    │      │                    │
  │                    ├──► storage (blob uploads; SWA URLs → blob CORS)
  │                    │      │
  │                    └───► app-service ◄────────┘
  │                  (SWA URLs → CORS; KV → secrets; optional storage → AZURE_STORAGE_*)
  └───────────────────┘      └───────────────────┘
```

Cross-stack data passes via `terraform_remote_state` data sources, not hand-copied
tfvars. Each env's `app-service/main.tf` reads:

- ACR info from `shared/foundation`
- secret URIs + vault ID from its own env's `key-vault` state
- Static Web App HTTPS URLs from its own env's `static-web-apps` state (feeds
  `CORS_ORIGINS` on the API)

Each env's `key-vault/main.tf` reads:

- `DATABASE_URL` from its own env's `database` state, then stores it as a secret
- generates and stores `BETTER_AUTH_SECRET`

And `prod/front-door/main.tf` reads:

- OPS hostname from `prod/static-web-apps` state (Static Web App origin)
- API hostname from `prod/app-service` state

That means `staging/app-service` _cannot_ accidentally read prod's database —
the backend key is the contract.

## Azure Front Door (edge + WAF + multi-region readiness)

`modules/front-door` defines one AFD Standard profile with two endpoints
(OPS + API), each pointing at its App Service origin, plus a WAF policy with
rate-limiting and scanner-path blocking custom rules. `envs/prod/front-door`
instantiates it for prod.

Why split-host (two endpoints) instead of same-origin (path routing)?
`packages/env/src/web.ts` validates `VITE_SERVER_URL` with `z.url()`, so the
bundle can't call the API via relative paths without a schema change. Two
endpoints sidestep the issue: the OPS bundle keeps calling
`${VITE_SERVER_URL}/trpc` and `${VITE_SERVER_URL}/api/auth/*`, just with
`VITE_SERVER_URL` pointing at the API endpoint hostname instead of the
App Service hostname. Origin swap, no code change.

Multi-region is now a single-resource addition: add an `azurerm_cdn_frontdoor_origin`
with `priority = 2` to either origin group (e.g. a second App Service in
North Europe) and AFD handles failover. No changes to routes or endpoints.

### Subscription restriction

**Azure for Students and Free Trial subscriptions block AFD entirely.**
`terraform apply` fails with:

```
BadRequest: Free Trial and Student account is forbidden for Azure Frontdoor resources.
```

To deploy:

1. Upgrade the subscription to Pay-As-You-Go (Azure Portal → Subscriptions →
   select "Azure for Students" → **Upgrade**). Any remaining credit survives
   the upgrade.
2. Re-run `terraform apply` in `envs/prod/front-door/`.

Until then, the AFD stack exists as code only — plans cleanly, doesn't apply.

### After the first apply

Outputs include `api_endpoint_hostname` and `ops_endpoint_hostname`. To route
the OPS **Static Web App** through AFD:

1. Set the repository variable `VITE_SERVER_URL` to `https://<api_endpoint_hostname>`
   (or the API’s direct App Service URL if you are not using the API AFD endpoint).
2. Re-run **Actions → `Production — full release (API + frontends)`** (or run `.github/workflows/production-deploy.yml` via workflow dispatch) using **`main`** so
   it runs) so the OPS bundle is rebuilt with the new API origin.

To lock App Service origins down so _only_ AFD can reach them (recommended
hardening; follow-up after the first apply):

1. Copy `profile_resource_guid` from this stack's outputs.
2. Add an `ip_restriction` block to `modules/app-service/main.tf` that
   matches `x_azure_fdid` header against that GUID.
3. Apply `envs/prod/app-service`.

This is a second-pass change to avoid a circular data dependency at bootstrap.

## Key Vault runtime secrets

`modules/key-vault` introduces per-environment secret storage and makes App
Service consume secrets via Key Vault references:

- `DATABASE_URL` is read from the env's `database` state and written to Key Vault
- `BETTER_AUTH_SECRET` is generated in the key-vault stack and written to Key Vault
- `EMAIL_API_KEY` and `EMAIL_FROM` (Resend) are provided at **`key-vault` apply**
  time (`email_api_key` / `email_from` Terraform variables) and stored in Key Vault
- `app-service` stores only references:
  - `DATABASE_URL = @Microsoft.KeyVault(SecretUri=<versionless-uri>)`
  - `BETTER_AUTH_SECRET = @Microsoft.KeyVault(SecretUri=<versionless-uri>)`
  - `EMAIL_API_KEY = @Microsoft.KeyVault(SecretUri=<versionless-uri>)`
  - `EMAIL_FROM = @Microsoft.KeyVault(SecretUri=<versionless-uri>)`
- `app-service` grants `Key Vault Secrets User` on the vault to the **API**
  web app's managed identity only

Because references use versionless secret URIs, rotating a secret in Key Vault
doesn't require changing Terraform app settings.

**Apply order when adding mail secrets:** `terraform apply` in
`envs/<staging|prod>/key-vault/` first (so state exports the new secret URIs),
then `terraform apply` in `envs/<env>/app-service/`.

Do **not** commit real Resend credentials in `terraform.tfvars`.
Pass `email_api_key` / `email_from` via **`-var`**, **`TF_VAR_email_api_key`** /
**`TF_VAR_email_from`**, or a **gitignored** `*.tfvars`.

**Reuse [`apps/api/.env`](../apps/api/.env) locally:** the API uses the same names
(`EMAIL_API_KEY`, `EMAIL_FROM`). From `terraform/envs/staging/key-vault` or
`.../prod/key-vault`:

```bash
set -a
source ../../../../apps/api/.env
set +a
export TF_VAR_email_api_key="$EMAIL_API_KEY"
export TF_VAR_email_from="$EMAIL_FROM"
terraform apply
```

Use different values per Azure environment if staging and prod should differ;
otherwise you can source the same file for both `key-vault` applies.

`set -a` + `source` exports every variable defined in that file for the shell — to
avoid that, export only `TF_VAR_email_*` manually or extract just those keys.

## Static Web Apps + GitHub Actions

`modules/static-web-app` creates one SWA per frontend. Terraform exports each
site's **deployment token** as a sensitive output — map those to GitHub Actions
repository secrets (`SWA_TOKEN_OPS_PROD`, …) so `.github/workflows/production-deploy.yml`
can upload `dist/` after `turbo build`. Static Web Apps are intentionally **not**
stored in Key Vault here: the deploy token is a CI secret, not a runtime API
secret.

## GitHub Actions OIDC

The `ci-identity` module creates federated credentials in a `for_each` loop
driven by the `github_environments` tfvar. Adding a new environment (e.g.
`uat`) is a one-line change in `envs/shared/ci-identity/terraform.tfvars`:

```hcl
github_environments = ["staging", "prod", "uat"]
```

Apply and you get a new OIDC trust for `environment:uat` that a workflow can
claim with `environment: uat` in its job config.

`.github/workflows/staging-deploy.yml` and the **API** job in
`.github/workflows/production-deploy.yml` use GitHub **Environments** (`staging` /
`prod`) so the OIDC subject matches the env-scoped federated credentials
from `ci-identity`. Ensure those environment names exist under repo **Settings
→ Environments**.

## Blob storage (user/admin image uploads)

`modules/storage` provisions a **Standard LRS** StorageV2 account, a **private**
blob container (default name `images`), **CORS** from the env’s Static Web App
URLs (so browsers can `PUT` using a signed URL), and **Storage Blob Data
Contributor** for the API’s **system-assigned managed identity**.

Shared access keys are **disabled** on the account; use **user delegation SAS**
from the API (Entra ID + `@azure/storage-blob`) for upload and download URLs.

**Apply order:** `static-web-apps` and `app-service` must exist first (storage
reads the API principal ID and SWA URLs from remote state). Then:

1. `terraform apply` in `envs/<env>/storage/` (or `pnpm tf:apply:prod:storage`).
2. In `envs/<env>/app-service/terraform.tfvars`, set `wire_storage = true` and
   re-apply app-service so the API receives `AZURE_STORAGE_ACCOUNT_NAME` and
   `AZURE_STORAGE_CONTAINER`.

If the chosen `storage_account_name` is not globally unique, change it in
`envs/<env>/storage/terraform.tfvars` and re-apply.

## Remote state

State lives in **Azure Blob Storage**, not locally. The backing storage account
is bootstrapped once by `scripts/bootstrap-tfstate.sh`. The script is
idempotent — re-running does nothing if everything already exists.

What the bootstrap creates:

- Resource group `rg-deck-pack-tfstate` (separate from app infra so it can
  never be nuked by a stack destroy)
- Storage account `stdeckpacktfstatejw` — shared key access **disabled**
  (Entra ID auth only), public blob access disabled, TLS 1.2 minimum
- Container `tfstate` with **blob versioning enabled** and 30-day soft-delete.
  Every `terraform apply` writes a new blob version, so you can recover from
  a botched state edit by restoring a prior version.
- RBAC: `Storage Blob Data Contributor` on the storage account for the
  signed-in user. This is the role the azurerm backend needs when
  `use_azuread_auth = true`.

Bootstrap:

```sh
./scripts/bootstrap-tfstate.sh
```

Each env's `versions.tf` has its own backend key. Authentication is via
`az login` — no storage account keys in env vars, no keys on disk.

### When a new developer joins

They run `az login`, then they need `Storage Blob Data Contributor` on the
storage account. Either re-run `scripts/bootstrap-tfstate.sh` while signed in
as them (idempotent, grants their user), or add them manually:

```sh
az role assignment create \
  --assignee "<their-email-or-OID>" \
  --role "Storage Blob Data Contributor" \
  --scope "$(az storage account show -n stdeckpacktfstatejw -g rg-deck-pack-tfstate --query id -o tsv)"
```

Then `terraform -chdir=terraform/envs/<env>/<stack> init` and they're in.

## Lifecycle protection on sensitive secrets

One `random_password` resource still has `lifecycle { prevent_destroy = true }`:

- `modules/database/main.tf :: random_password.admin` — this is the only
  credential the API has for the database.

`BETTER_AUTH_SECRET` now lives in Key Vault and can be rotated by updating the
Key Vault secret value.

## Apply order (cold start)

```sh
# once
./scripts/bootstrap-tfstate.sh

# shared first — prod/staging read foundation outputs
terraform -chdir=terraform/envs/shared/foundation init
terraform -chdir=terraform/envs/shared/foundation apply

terraform -chdir=terraform/envs/shared/ci-identity init
terraform -chdir=terraform/envs/shared/ci-identity apply

# then an env — database → key-vault → static-web-apps → app-service
terraform -chdir=terraform/envs/prod/database init
terraform -chdir=terraform/envs/prod/database apply

terraform -chdir=terraform/envs/prod/key-vault init
terraform -chdir=terraform/envs/prod/key-vault apply

terraform -chdir=terraform/envs/prod/static-web-apps init
terraform -chdir=terraform/envs/prod/static-web-apps apply

terraform -chdir=terraform/envs/prod/app-service init
terraform -chdir=terraform/envs/prod/app-service apply

# uploads blob storage (after app-service + static-web-apps; then set wire_storage = true on app-service)
terraform -chdir=terraform/envs/prod/storage init
terraform -chdir=terraform/envs/prod/storage apply

# optional: Front Door in front of prod (requires non-Student subscription)
terraform -chdir=terraform/envs/prod/front-door init
terraform -chdir=terraform/envs/prod/front-door apply
```

For staging, swap `prod` → `staging` in the last eight commands.

## Adding a new environment

Only three things change per environment:

1. **A new directory** `envs/<newenv>/database/` + `envs/<newenv>/key-vault/` + `envs/<newenv>/static-web-apps/` + `envs/<newenv>/app-service/`
   (copy from `envs/staging/`, update tfvars)
2. **New backend keys** in each `versions.tf` (e.g. `qa-database.tfstate`, `qa-key-vault.tfstate`, `qa-static-web-apps.tfstate`)
3. **A new entry** in `envs/shared/ci-identity/terraform.tfvars` →
   `github_environments = ["staging", "prod", "qa"]`, then re-apply to
   provision the OIDC federated credential.

Module HCL is untouched.

## pnpm scripts

Every (env, stack) combination has `init`, `plan`, `apply` scripts:

```sh
pnpm tf:init:shared:foundation
pnpm tf:plan:prod:database
pnpm tf:apply:staging:app-service
# …etc
```

See `package.json` for the full list.

## Common issues

**`SubscriptionNotFound` on first `az` create** — the student subscription
disables automatic provider registration. Register the provider once:

```sh
az provider register --namespace Microsoft.<WhateverFailed>
# wait for `Registered` in `az provider show -n Microsoft.<…> -o tsv --query registrationState`
```

Providers we've already registered: `Microsoft.ContainerRegistry`,
`Microsoft.Web`, `Microsoft.DBforPostgreSQL`, `Microsoft.Storage`.

**`No valid credentials found`** — run `az login`, check `az account show`
points at the right subscription, then re-run Terraform.

**DNS name reservation after a failed create** — some Azure resources hold
their global DNS name for up to 24h after a failed create. If you see
`InvalidResourceLocation`, change the `*_name` in tfvars to something
unique (e.g. add a regional suffix).

**Stale state lock after an interrupted apply** — if a `terraform apply`
dies mid-flight (shell killed, network drop, CI timeout), the blob lock
stays held. Read the lock ID from the error message and release it:

```sh
terraform -chdir=terraform/envs/<env>/<stack> force-unlock -force <lock-id>
```

Only do this when you're certain no other apply is actually running.
