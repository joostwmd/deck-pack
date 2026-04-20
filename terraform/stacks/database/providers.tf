provider "azurerm" {
  features {}

  subscription_id = var.subscription_id
  # Explicit registration — we register Microsoft.DBforPostgreSQL manually once,
  # same pattern as the other stacks in this repo.
  resource_provider_registrations = "none"
}
