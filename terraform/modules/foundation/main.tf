resource "azurerm_resource_group" "core" {
  name     = var.resource_group_name
  location = var.location
  tags     = var.tags
}

resource "azurerm_container_registry" "main" {
  name                = var.acr_name
  resource_group_name = azurerm_resource_group.core.name
  location            = azurerm_resource_group.core.location
  sku                 = var.acr_sku
  admin_enabled       = false
  tags                = var.tags
}
