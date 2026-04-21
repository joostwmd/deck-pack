output "resource_group_name" {
  description = "Resource group name used for shared cloud resources."
  value       = module.this.resource_group_name
}

output "acr_name" {
  description = "Azure Container Registry name."
  value       = module.this.acr_name
}

output "acr_login_server" {
  description = "ACR login server for docker login/push."
  value       = module.this.acr_login_server
}

output "acr_id" {
  description = "ACR resource ID (useful for role assignments)."
  value       = module.this.acr_id
}
