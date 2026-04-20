terraform {
  required_version = ">= 1.7.0"

  # Backend key unchanged from pre-refactor layout — we're reusing the same
  # state blob so no resources get recreated. The `moved` blocks in moved.tf
  # handle the HCL-address shift from `foo.bar` to `module.this.foo.bar`.
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
