output "github_ci_app_name" {
  description = "Display name of the GitHub CI application registration."
  value       = azuread_application.github_ci.display_name
}

output "github_ci_client_id" {
  description = "App registration client ID. Set as GitHub secret: AZURE_CLIENT_ID."
  value       = azuread_application.github_ci.client_id
}

output "github_ci_service_principal_object_id" {
  description = "Service principal object ID (for additional role assignments outside this module)."
  value       = azuread_service_principal.github_ci.object_id
}
