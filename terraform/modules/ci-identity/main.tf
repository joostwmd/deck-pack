resource "azuread_application" "github_ci" {
  display_name = var.identity_name
}

resource "azuread_service_principal" "github_ci" {
  client_id = azuread_application.github_ci.client_id
}

# Branch-level trust. CI workflows running on this branch can exchange a
# workload identity token for an Entra ID access token.
resource "azuread_application_federated_identity_credential" "github_main_branch" {
  application_id = azuread_application.github_ci.id
  display_name   = "github-${var.github_owner}-${var.github_repo}-${var.github_branch}"
  description    = "OIDC trust for GitHub Actions branch deployments"
  audiences      = ["api://AzureADTokenExchange"]
  issuer         = "https://token.actions.githubusercontent.com"
  subject        = "repo:${var.github_owner}/${var.github_repo}:ref:refs/heads/${var.github_branch}"
}

# Pull request trust so CI can run on feature branches without merging first.
resource "azuread_application_federated_identity_credential" "github_pull_request" {
  application_id = azuread_application.github_ci.id
  display_name   = "github-${var.github_owner}-${var.github_repo}-pull-request"
  description    = "OIDC trust for GitHub Actions pull_request events (CI iteration)"
  audiences      = ["api://AzureADTokenExchange"]
  issuer         = "https://token.actions.githubusercontent.com"
  subject        = "repo:${var.github_owner}/${var.github_repo}:pull_request"
}

# Environment-level trust (one per GitHub Actions environment). Use this subject
# form when a workflow declares `environment: <name>` — it lets you restrict
# which environments can claim this identity, and pairs with GitHub environment
# protection rules (required reviewers, branch filters, etc.).
resource "azuread_application_federated_identity_credential" "github_environment" {
  for_each       = toset(var.github_environments)
  application_id = azuread_application.github_ci.id
  display_name   = "github-${var.github_owner}-${var.github_repo}-env-${each.key}"
  description    = "OIDC trust for GitHub Actions environment:${each.key}"
  audiences      = ["api://AzureADTokenExchange"]
  issuer         = "https://token.actions.githubusercontent.com"
  subject        = "repo:${var.github_owner}/${var.github_repo}:environment:${each.key}"
}

resource "azurerm_role_assignment" "acr_push" {
  scope                = var.acr_id
  role_definition_name = "AcrPush"
  principal_id         = azuread_service_principal.github_ci.object_id
}
