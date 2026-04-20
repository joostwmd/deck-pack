# State address migration. Note: `prevent_destroy = true` on the admin password
# blocks Terraform from destroying that resource — but `moved {}` blocks only
# REWRITE state addresses, they don't destroy anything, so the lifecycle
# protection doesn't interfere with the migration.

moved {
  from = random_password.admin
  to   = module.this.random_password.admin
}

moved {
  from = azurerm_postgresql_flexible_server.main
  to   = module.this.azurerm_postgresql_flexible_server.main
}

moved {
  from = azurerm_postgresql_flexible_server_firewall_rule.allow_azure_services
  to   = module.this.azurerm_postgresql_flexible_server_firewall_rule.allow_azure_services
}

# `count`-based resource: the index stays the same when moving into the module;
# Terraform applies the move per-instance.
moved {
  from = azurerm_postgresql_flexible_server_firewall_rule.allow_developer
  to   = module.this.azurerm_postgresql_flexible_server_firewall_rule.allow_developer
}

moved {
  from = azurerm_postgresql_flexible_server_database.app
  to   = module.this.azurerm_postgresql_flexible_server_database.app
}
