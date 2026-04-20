output "plan_id" {
  description = "App Service plan resource ID (shared by future web apps like the API)."
  value       = azurerm_service_plan.main.id
}

output "plan_name" {
  description = "App Service plan name."
  value       = azurerm_service_plan.main.name
}

output "ops_app_name" {
  description = "Name of the OPS Linux Web App."
  value       = azurerm_linux_web_app.ops.name
}

output "ops_default_hostname" {
  description = "Public hostname of the OPS web app."
  value       = azurerm_linux_web_app.ops.default_hostname
}

output "ops_url" {
  description = "Public URL of the OPS web app."
  value       = "https://${azurerm_linux_web_app.ops.default_hostname}"
}

output "ops_principal_id" {
  description = "System-assigned managed identity principal ID for the OPS web app."
  value       = azurerm_linux_web_app.ops.identity[0].principal_id
}
