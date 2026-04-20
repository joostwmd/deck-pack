terraform {
  required_version = ">= 1.7.0"

  # Remote state on Azure Blob Storage. Bootstrap the backing account by running
  # scripts/bootstrap-tfstate.sh once (idempotent). use_azuread_auth = true means
  # this backend authenticates via the signed-in user (az login) or, in CI, the
  # OIDC federated credential — never storage account keys.
  backend "azurerm" {
    resource_group_name  = "rg-deck-pack-tfstate"
    storage_account_name = "stdeckpacktfstatejw"
    container_name       = "tfstate"
    key                  = "foundation.tfstate"
    use_azuread_auth     = true
  }

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
  }
}
