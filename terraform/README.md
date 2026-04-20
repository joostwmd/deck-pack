# Terraform

Azure infrastructure for deck-pack, organised as **stacks per capability**:

| Stack         | What it owns                                                            |
| ------------- | ----------------------------------------------------------------------- |
| `foundation`  | Resource group, Azure Container Registry                                |
| `ci-identity` | Entra ID app + OIDC federated credentials for GitHub Actions            |
| `database`    | Postgres Flexible Server, firewall rules, generated admin password      |
| `app-service` | App Service Plan + Linux Web Apps (OPS frontend, API backend) + AcrPull |

Each stack has its own state file and is applied independently.

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

Each stack's `versions.tf` has the backend config. Authentication is via
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

Then `terraform -chdir=terraform/stacks/<stack> init` and they're in.

## Lifecycle protection on sensitive secrets

Two `random_password` resources have `lifecycle { prevent_destroy = true }`:

- `app-service/main.tf :: random_password.better_auth_secret` — rotating this
  invalidates every session cookie.
- `database/main.tf :: random_password.admin` — this is the only credential
  the API has for the database.

Terraform refuses to destroy these; rotation requires removing the
`lifecycle` block, applying, then putting it back.

## Apply order (cold start)

```sh
# once
./scripts/bootstrap-tfstate.sh

# per stack
terraform -chdir=terraform/stacks/foundation init
terraform -chdir=terraform/stacks/foundation apply

terraform -chdir=terraform/stacks/ci-identity init
terraform -chdir=terraform/stacks/ci-identity apply

terraform -chdir=terraform/stacks/database init
terraform -chdir=terraform/stacks/database apply

# app-service consumes database output:
export TF_VAR_database_url="$(terraform -chdir=terraform/stacks/database output -raw database_url)"
terraform -chdir=terraform/stacks/app-service init
terraform -chdir=terraform/stacks/app-service apply
```

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
