data "azurerm_client_config" "current" {}

resource "azurerm_key_vault" "main" {
  name                       = var.key_vault_name
  location                   = var.location
  resource_group_name        = var.resource_group_name
  tenant_id                  = data.azurerm_client_config.current.tenant_id
  sku_name                   = "standard"
  soft_delete_retention_days = var.soft_delete_retention_days
  purge_protection_enabled   = var.purge_protection_enabled
  rbac_authorization_enabled = true
  tags                       = var.tags
}

resource "azurerm_role_assignment" "current_user_kv_admin" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Administrator"
  principal_id         = data.azurerm_client_config.current.object_id
}

resource "random_password" "better_auth_secret" {
  length  = var.better_auth_secret_length
  special = false
}

resource "azurerm_key_vault_secret" "database_url" {
  name         = var.database_url_secret_name
  value        = var.database_url
  key_vault_id = azurerm_key_vault.main.id
  content_type = "text/plain"
  tags         = var.tags
  depends_on   = [azurerm_role_assignment.current_user_kv_admin]
}

resource "azurerm_key_vault_secret" "better_auth_secret" {
  name         = var.better_auth_secret_name
  value        = random_password.better_auth_secret.result
  key_vault_id = azurerm_key_vault.main.id
  content_type = "text/plain"
  tags         = var.tags
  depends_on   = [azurerm_role_assignment.current_user_kv_admin]
}

resource "azurerm_key_vault_secret" "email_api_key" {
  name         = var.email_api_key_secret_name
  value        = var.email_api_key
  key_vault_id = azurerm_key_vault.main.id
  content_type = "text/plain"
  tags         = var.tags
  depends_on   = [azurerm_role_assignment.current_user_kv_admin]
}

resource "azurerm_key_vault_secret" "email_from" {
  name         = var.email_from_secret_name
  value        = var.email_from
  key_vault_id = azurerm_key_vault.main.id
  content_type = "text/plain"
  tags         = var.tags
  depends_on   = [azurerm_role_assignment.current_user_kv_admin]
}
