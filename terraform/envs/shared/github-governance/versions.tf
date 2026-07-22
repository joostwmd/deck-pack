terraform {
  required_version = ">= 1.7.0"

  backend "azurerm" {
    resource_group_name  = "rg-deck-pack-tfstate"
    storage_account_name = "stdeckpacktfstatedpc"
    container_name       = "tfstate"
    key                  = "github-governance.tfstate"
    use_azuread_auth     = true
  }

  required_providers {
    github = {
      source  = "integrations/github"
      version = "~> 6.0"
    }
  }
}
