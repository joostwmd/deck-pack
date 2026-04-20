output "server_name" {
  description = "Postgres Flexible Server name."
  value       = azurerm_postgresql_flexible_server.main.name
}

output "server_fqdn" {
  description = "Fully qualified DNS name of the Postgres server."
  value       = azurerm_postgresql_flexible_server.main.fqdn
}

output "database_name" {
  description = "Application database name."
  value       = azurerm_postgresql_flexible_server_database.app.name
}

output "admin_username" {
  description = "Postgres admin login."
  value       = azurerm_postgresql_flexible_server.main.administrator_login
}

output "admin_password" {
  description = "Generated admin password. Read with: terraform output -raw admin_password"
  value       = random_password.admin.result
  sensitive   = true
}

output "database_url" {
  description = "Ready-to-use DATABASE_URL for the API (sslmode=require). Read with: terraform output -raw database_url"
  value = format(
    "postgresql://%s:%s@%s:5432/%s?sslmode=require",
    azurerm_postgresql_flexible_server.main.administrator_login,
    random_password.admin.result,
    azurerm_postgresql_flexible_server.main.fqdn,
    azurerm_postgresql_flexible_server_database.app.name,
  )
  sensitive = true
}
