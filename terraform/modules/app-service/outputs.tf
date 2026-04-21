output "plan_id" {
  description = "App Service plan resource ID."
  value       = azurerm_service_plan.main.id
}

output "plan_name" {
  description = "App Service plan name."
  value       = azurerm_service_plan.main.name
}

output "api_app_name" {
  description = "Name of the API Linux Web App."
  value       = azurerm_linux_web_app.api.name
}

output "api_default_hostname" {
  description = "Public hostname of the API web app."
  value       = azurerm_linux_web_app.api.default_hostname
}

output "api_url" {
  description = "Public URL of the API web app."
  value       = "https://${azurerm_linux_web_app.api.default_hostname}"
}

output "api_principal_id" {
  description = "System-assigned managed identity principal ID for the API web app."
  value       = azurerm_linux_web_app.api.identity[0].principal_id
}
