output "github_ci_app_name" {
  description = "Display name of the GitHub CI application registration."
  value       = module.this.github_ci_app_name
}

output "github_ci_client_id" {
  description = "Set as GitHub secret: AZURE_CLIENT_ID"
  value       = module.this.github_ci_client_id
}

output "github_ci_tenant_id" {
  description = "Set as GitHub secret: AZURE_TENANT_ID"
  value       = var.tenant_id
}

output "github_ci_subscription_id" {
  description = "Set as GitHub secret: AZURE_SUBSCRIPTION_ID"
  value       = var.subscription_id
}

output "github_acr_name" {
  description = "Set as GitHub variable: ACR_NAME"
  value       = var.acr_name
}

output "github_acr_login_server" {
  description = "Set as GitHub variable: ACR_LOGIN_SERVER"
  value       = var.acr_login_server
}

output "github_ci_service_principal_object_id" {
  description = "Service principal object ID (for extra role assignments)."
  value       = module.this.github_ci_service_principal_object_id
}
