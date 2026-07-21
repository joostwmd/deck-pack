#!/usr/bin/env bash
# Apply API secrets from apps/api/.env to Azure Key Vault, then wire App Service.
#
# Usage:
#   ./scripts/tf-apply-api-secrets.sh staging
#   ./scripts/tf-apply-api-secrets.sh prod
#
# Requires:
#   - az login (for Terraform Azure provider)
#   - apps/api/.env populated with EMAIL_*, PEXELS_*, BRANDFETCH_*, NOUN_PROJECT_* keys
#
# Order: key-vault (writes secrets) → app-service (Key Vault refs + OPS_ORIGINS)

set -euo pipefail

ENV="${1:-}"
if [[ "$ENV" != "staging" && "$ENV" != "prod" ]]; then
  echo "Usage: $0 <staging|prod>" >&2
  exit 1
fi

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${API_ENV_FILE:-$ROOT/apps/api/.env}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing env file: $ENV_FILE" >&2
  exit 1
fi

# shellcheck disable=SC1090
set -a
source "$ENV_FILE"
set +a

require_var() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "Missing required variable in $ENV_FILE: $name" >&2
    exit 1
  fi
}

require_var EMAIL_API_KEY
require_var EMAIL_FROM
require_var PEXELS_API_KEY
require_var BRANDFETCH_API_KEY
require_var BRANDFETCH_CLIENT_ID
require_var NOUN_PROJECT_API_KEY
require_var NOUN_PROJECT_API_SECRET

export TF_VAR_email_api_key="$EMAIL_API_KEY"
export TF_VAR_email_from="$EMAIL_FROM"
export TF_VAR_pexels_api_key="$PEXELS_API_KEY"
export TF_VAR_brandfetch_api_key="$BRANDFETCH_API_KEY"
export TF_VAR_brandfetch_client_id="$BRANDFETCH_CLIENT_ID"
export TF_VAR_noun_project_api_key="$NOUN_PROJECT_API_KEY"
export TF_VAR_noun_project_api_secret="$NOUN_PROJECT_API_SECRET"

cd "$ROOT"

echo "==> Applying $ENV key-vault (API secrets)..."
pnpm "tf:apply:${ENV}:key-vault"

echo "==> Applying $ENV app-service (Key Vault refs + OPS_ORIGINS)..."
pnpm "tf:apply:${ENV}:app-service"

echo "Done. Restart the API Web App if it was already running:"
if [[ "$ENV" == "staging" ]]; then
  echo "  az webapp restart -g rg-deck-pack-cloud -n deck-pack-api-staging-dpc"
else
  echo "  az webapp restart -g rg-deck-pack-cloud -n deck-pack-api-dpc"
fi
