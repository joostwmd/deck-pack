output "github_ci_app_name" {
  description = "Display name of the GitHub CI application registration."
  value       = azuread_application.github_ci.display_name
}

output "github_ci_client_id" {
  description = "Set as GitHub secret: AZURE_CLIENT_ID"
  value       = azuread_application.github_ci.client_id
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

output "github_oidc_subject" {
  description = "OIDC subject configured for this identity."
  value       = azuread_application_federated_identity_credential.github_main_branch.subject
}
