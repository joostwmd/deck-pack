output "storage_account_id" {
  value       = module.this.storage_account_id
  description = "Storage account resource ID."
}

output "storage_account_name" {
  value       = module.this.storage_account_name
  description = "Set AZURE_STORAGE_ACCOUNT_NAME on the API when wiring app-service."
}

output "primary_blob_endpoint" {
  value       = module.this.primary_blob_endpoint
  description = "Blob endpoint for constructing URLs in the API."
}

output "container_name" {
  value       = module.this.container_name
  description = "Set AZURE_STORAGE_CONTAINER on the API when wiring app-service."
}
