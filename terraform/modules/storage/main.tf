resource "azurerm_storage_account" "main" {
  name                            = var.storage_account_name
  resource_group_name             = var.resource_group_name
  location                        = var.location
  account_tier                    = "Standard"
  account_kind                    = "StorageV2"
  account_replication_type        = var.account_replication_type
  min_tls_version                 = "TLS1_2"
  allow_nested_items_to_be_public = false
  https_traffic_only_enabled      = true
  shared_access_key_enabled       = var.shared_access_key_enabled

  dynamic "blob_properties" {
    for_each = length(var.cors_allowed_origins) > 0 ? [1] : []
    content {
      cors_rule {
        allowed_headers    = var.cors_allowed_headers
        allowed_methods    = var.cors_allowed_methods
        allowed_origins    = var.cors_allowed_origins
        exposed_headers    = var.cors_exposed_headers
        max_age_in_seconds = var.cors_max_age_seconds
      }
    }
  }

  tags = var.tags
}

resource "azurerm_storage_container" "uploads" {
  name                  = var.container_name
  storage_account_id    = azurerm_storage_account.main.id
  container_access_type = "private"
}

resource "azurerm_role_assignment" "blob_data_contributor" {
  for_each             = toset(var.blob_data_principal_ids)
  scope                = azurerm_storage_account.main.id
  role_definition_name = "Storage Blob Data Contributor"
  principal_id         = each.value
}
