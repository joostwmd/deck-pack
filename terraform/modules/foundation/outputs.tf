output "resource_group_name" {
  description = "Resource group name used for shared cloud resources."
  value       = azurerm_resource_group.core.name
}

output "acr_name" {
  description = "Azure Container Registry name."
  value       = azurerm_container_registry.main.name
}

output "acr_login_server" {
  description = "ACR login server for docker login/push."
  value       = azurerm_container_registry.main.login_server
}

output "acr_id" {
  description = "ACR resource ID (useful for role assignments)."
  value       = azurerm_container_registry.main.id
}
