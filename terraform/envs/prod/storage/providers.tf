provider "azurerm" {
  features {}

  subscription_id                 = var.subscription_id
  resource_provider_registrations = "none"
  # Required when shared_access_key_enabled = false on the storage account.
  storage_use_azuread = true
}
