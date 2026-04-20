provider "azurerm" {
  features {}

  subscription_id = var.subscription_id
  # Keep provider registration explicit to avoid broad auto-registration conflicts
  # (common on limited/student subscriptions).
  resource_provider_registrations = "none"
}
