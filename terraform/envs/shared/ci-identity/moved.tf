# State address migration: wrapping the flat stack in a module. The `environment`
# credentials are NEW (didn't exist pre-refactor), so no moved block for them —
# they show up as additions in the plan.

moved {
  from = azuread_application.github_ci
  to   = module.this.azuread_application.github_ci
}

moved {
  from = azuread_service_principal.github_ci
  to   = module.this.azuread_service_principal.github_ci
}

moved {
  from = azuread_application_federated_identity_credential.github_main_branch
  to   = module.this.azuread_application_federated_identity_credential.github_main_branch
}

moved {
  from = azuread_application_federated_identity_credential.github_pull_request
  to   = module.this.azuread_application_federated_identity_credential.github_pull_request
}

moved {
  from = azurerm_role_assignment.acr_push
  to   = module.this.azurerm_role_assignment.acr_push
}
