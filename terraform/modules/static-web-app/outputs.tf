output "id" {
  description = "Resource ID of the Static Web App."
  value       = azurerm_static_web_app.this.id
}

output "default_host_name" {
  description = "Default hostname (e.g. xxx.azurestaticapps.net)."
  value       = azurerm_static_web_app.this.default_host_name
}

output "default_url" {
  description = "HTTPS URL of the default hostname."
  value       = "https://${azurerm_static_web_app.this.default_host_name}"
}

output "api_key" {
  description = "Deployment token for GitHub Actions / SWA CLI. Store as a GitHub Actions secret (never commit)."
  value       = azurerm_static_web_app.this.api_key
  sensitive   = true
}
