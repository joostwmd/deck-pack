output "server_name" {
  description = "Postgres Flexible Server name."
  value       = module.this.server_name
}

output "server_fqdn" {
  description = "Fully qualified DNS name of the Postgres server."
  value       = module.this.server_fqdn
}

output "database_name" {
  description = "Application database name."
  value       = module.this.database_name
}

output "admin_username" {
  description = "Postgres admin login."
  value       = module.this.admin_username
}

output "admin_password" {
  description = "Generated admin password. Read with: terraform output -raw admin_password"
  value       = module.this.admin_password
  sensitive   = true
}

output "database_url" {
  description = "Ready-to-use DATABASE_URL for the API (sslmode=require). Read with: terraform output -raw database_url"
  value       = module.this.database_url
  sensitive   = true
}
