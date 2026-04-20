moved {
  from = azurerm_service_plan.main
  to   = module.this.azurerm_service_plan.main
}

moved {
  from = azurerm_linux_web_app.ops
  to   = module.this.azurerm_linux_web_app.ops
}

moved {
  from = azurerm_role_assignment.ops_acr_pull
  to   = module.this.azurerm_role_assignment.ops_acr_pull
}

moved {
  from = random_password.better_auth_secret
  to   = module.this.random_password.better_auth_secret
}

moved {
  from = azurerm_linux_web_app.api
  to   = module.this.azurerm_linux_web_app.api
}

moved {
  from = azurerm_role_assignment.api_acr_pull
  to   = module.this.azurerm_role_assignment.api_acr_pull
}
