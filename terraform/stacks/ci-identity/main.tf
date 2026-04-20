resource "azuread_application" "github_ci" {
  display_name = var.identity_name
}

resource "azuread_service_principal" "github_ci" {
  client_id = azuread_application.github_ci.client_id
}

resource "azuread_application_federated_identity_credential" "github_main_branch" {
  application_id = azuread_application.github_ci.id
  display_name   = "github-${var.github_owner}-${var.github_repo}-${var.github_branch}"
  description    = "OIDC trust for GitHub Actions branch deployments"
  audiences      = ["api://AzureADTokenExchange"]
  issuer         = "https://token.actions.githubusercontent.com"
  subject        = "repo:${var.github_owner}/${var.github_repo}:ref:refs/heads/${var.github_branch}"
}

resource "azurerm_role_assignment" "acr_push" {
  scope                = var.acr_id
  role_definition_name = "AcrPush"
  principal_id         = azuread_service_principal.github_ci.object_id
}
