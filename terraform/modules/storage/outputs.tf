output "storage_account_id" {
  description = "Resource ID of the storage account."
  value       = azurerm_storage_account.main.id
}

output "storage_account_name" {
  description = "Storage account name (for AZURE_STORAGE_ACCOUNT_NAME / SDK)."
  value       = azurerm_storage_account.main.name
}

output "primary_blob_endpoint" {
  description = "Primary blob service endpoint."
  value       = azurerm_storage_account.main.primary_blob_endpoint
}

output "container_name" {
  description = "Private blob container name for uploads."
  value       = azurerm_storage_container.uploads.name
}
