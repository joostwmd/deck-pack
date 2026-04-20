# Terraform

Azure infrastructure for deck-pack, organised as **reusable modules + per-environment roots**.

```
terraform/
  modules/          Reusable HCL bodies — no backend, no provider config
    foundation/       RG + ACR
    ci-identity/      Entra app + OIDC federated credentials for GitHub Actions
    database/         Postgres Flexible Server + firewall + generated admin password
    app-service/      App Service Plan + OPS Web App + API Web App + AcrPull role assignments
  envs/             Per-environment roots — each has its own state file
    shared/           Cross-environment resources (one copy, both envs use)
      foundation/       → foundation.tfstate
      ci-identity/      → ci-identity.tfstate
    prod/             Production environment
      database/         → database.tfstate
      app-service/      → app-service.tfstate
    staging/          Staging environment (same shape as prod)
      database/         → staging-database.tfstate
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
  │   database        │      │   database        │
  │   app-service ◄───┘      │   app-service ◄───┘
  │                  (reads DATABASE_URL         │
  │                   via remote_state)          │
  └───────────────────┘      └───────────────────┘
```

Cross-stack data passes via `terraform_remote_state` data sources, not hand-copied
tfvars. Each env's `app-service/main.tf` reads:

- ACR info from `shared/foundation`
- `DATABASE_URL` from its own env's `database` state

That means `staging/app-service` _cannot_ accidentally read prod's database —
the backend key is the contract.

## GitHub Actions OIDC

The `ci-identity` module creates federated credentials in a `for_each` loop
driven by the `github_environments` tfvar. Adding a new environment (e.g.
`uat`) is a one-line change in `envs/shared/ci-identity/terraform.tfvars`:

```hcl
github_environments = ["staging", "prod", "uat"]
```

Apply and you get a new OIDC trust for `environment:uat` that a workflow can
claim with `environment: uat` in its job config.

Today the workflow `.github/workflows/build-and-push.yml` still uses the
branch/PR federated credentials (not env-scoped). Env-scoped CI is the next
step once we have `terraform apply` wired up in CI.

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

Two `random_password` resources (defined inside modules, one instance per env)
have `lifecycle { prevent_destroy = true }`:

- `modules/app-service/main.tf :: random_password.better_auth_secret` —
  rotating this invalidates every session cookie.
- `modules/database/main.tf :: random_password.admin` — this is the only
  credential the API has for the database.

Terraform refuses to destroy these; rotation requires removing the
`lifecycle` block, applying, then putting it back.

## Apply order (cold start)

```sh
# once
./scripts/bootstrap-tfstate.sh

# shared first — prod/staging read foundation outputs
terraform -chdir=terraform/envs/shared/foundation init
terraform -chdir=terraform/envs/shared/foundation apply

terraform -chdir=terraform/envs/shared/ci-identity init
terraform -chdir=terraform/envs/shared/ci-identity apply

# then an env — database before app-service (app-service reads database_url)
terraform -chdir=terraform/envs/prod/database init
terraform -chdir=terraform/envs/prod/database apply

terraform -chdir=terraform/envs/prod/app-service init
terraform -chdir=terraform/envs/prod/app-service apply
```

For staging, swap `prod` → `staging` in the last four commands.

## Adding a new environment

Only three things change per environment:

1. **A new directory** `envs/<newenv>/database/` + `envs/<newenv>/app-service/`
   (copy from `envs/staging/`, update tfvars)
2. **New backend keys** in each `versions.tf` (e.g. `qa-database.tfstate`)
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
