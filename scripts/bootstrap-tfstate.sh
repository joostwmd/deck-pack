#!/usr/bin/env bash
# Bootstrap Azure Storage for Terraform remote state.
#
# This is a ONE-OFF, idempotent script. Re-running it is safe — each step checks
# whether the resource already exists before creating it.
#
# Solves the chicken-and-egg problem of "managing the thing that stores
# Terraform state with Terraform itself" by creating the bootstrap resources
# via the az CLI. Everything else in this repo is managed by Terraform; only
# this script is imperative.
#
# What it creates:
#   - Resource group:     rg-deck-pack-tfstate
#   - Storage account:    stdeckpacktfstatedpc  (globally unique; edit SUFFIX if taken)
#   - Blob container:     tfstate
#   - RBAC:               signed-in user granted "Storage Blob Data Contributor"
#                         on the storage account (required for use_azuread_auth)
#
# Hardening applied:
#   - Shared key (account key) access DISABLED   → Entra ID auth only
#   - Public blob access DISABLED
#   - TLS 1.2 minimum
#   - Blob versioning ENABLED                    → every state write is a new version
#   - 30-day soft-delete for blobs               → deleted state recoverable
#   - 30-day soft-delete for containers          → accidentally-dropped container recoverable

set -euo pipefail

# --- Config (edit SUFFIX if storage account name is taken) ----------------
LOCATION="westeurope"
RG="rg-deck-pack-tfstate"
SUFFIX="dpc"
STORAGE_ACCOUNT="stdeckpacktfstate${SUFFIX}"
CONTAINER="tfstate"
# --------------------------------------------------------------------------

bold() { printf "\n\033[1m==> %s\033[0m\n" "$1"; }

bold "Verifying Azure CLI login"
if ! az account show -o none 2>/dev/null; then
  echo "ERR: run 'az login' first." >&2
  exit 1
fi
SUBSCRIPTION_ID=$(az account show --query id -o tsv)
CURRENT_USER_OID=$(az ad signed-in-user show --query id -o tsv)
echo "   subscription: $SUBSCRIPTION_ID"
echo "   user OID:     $CURRENT_USER_OID"

bold "Resource group: $RG"
if az group show --name "$RG" -o none 2>/dev/null; then
  echo "   already exists"
else
  az group create --name "$RG" --location "$LOCATION" -o none
  echo "   created"
fi

bold "Storage account: $STORAGE_ACCOUNT"
if az storage account show --name "$STORAGE_ACCOUNT" --resource-group "$RG" -o none 2>/dev/null; then
  echo "   already exists"
else
  # --allow-shared-key-access false from birth; no account keys ever exist.
  # Auth to the data plane is exclusively via Entra ID.
  az storage account create \
    --name "$STORAGE_ACCOUNT" \
    --resource-group "$RG" \
    --location "$LOCATION" \
    --sku Standard_LRS \
    --kind StorageV2 \
    --encryption-services blob \
    --min-tls-version TLS1_2 \
    --allow-blob-public-access false \
    --allow-shared-key-access false \
    -o none
  echo "   created"
fi

SCOPE="/subscriptions/${SUBSCRIPTION_ID}/resourceGroups/${RG}/providers/Microsoft.Storage/storageAccounts/${STORAGE_ACCOUNT}"

bold "Role: Storage Blob Data Contributor on storage account (for current user)"
EXISTING=$(az role assignment list \
  --assignee "$CURRENT_USER_OID" \
  --scope "$SCOPE" \
  --role "Storage Blob Data Contributor" \
  --query "[0].id" -o tsv 2>/dev/null || true)

if [[ -n "$EXISTING" ]]; then
  echo "   already assigned"
else
  az role assignment create \
    --assignee-object-id "$CURRENT_USER_OID" \
    --assignee-principal-type User \
    --role "Storage Blob Data Contributor" \
    --scope "$SCOPE" \
    -o none
  echo "   assigned; waiting 30s for AAD propagation…"
  sleep 30
fi

bold "Container: $CONTAINER"
if az storage container show \
      --name "$CONTAINER" \
      --account-name "$STORAGE_ACCOUNT" \
      --auth-mode login \
      -o none 2>/dev/null; then
  echo "   already exists"
else
  az storage container create \
    --name "$CONTAINER" \
    --account-name "$STORAGE_ACCOUNT" \
    --auth-mode login \
    -o none
  echo "   created"
fi

bold "Blob service: versioning + soft-delete"
az storage account blob-service-properties update \
  --account-name "$STORAGE_ACCOUNT" \
  --resource-group "$RG" \
  --enable-versioning true \
  --enable-delete-retention true \
  --delete-retention-days 30 \
  --enable-container-delete-retention true \
  --container-delete-retention-days 30 \
  -o none
echo "   versioning=on, blob soft-delete=30d, container soft-delete=30d"

cat <<EOF

====================================================================
Bootstrap complete. Put this block in each stack's versions.tf:

  terraform {
    backend "azurerm" {
      resource_group_name  = "$RG"
      storage_account_name = "$STORAGE_ACCOUNT"
      container_name       = "$CONTAINER"
      key                  = "<stack-name>.tfstate"
      use_azuread_auth     = true
    }
  }

Then run inside each stack:

  terraform init -migrate-state

====================================================================
EOF
