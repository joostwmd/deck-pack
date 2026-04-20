output "server_name" {
  value = module.this.server_name
}

output "server_fqdn" {
  value = module.this.server_fqdn
}

output "database_name" {
  value = module.this.database_name
}

output "admin_username" {
  value = module.this.admin_username
}

output "admin_password" {
  description = "Generated admin password. Read with: terraform output -raw admin_password"
  value       = module.this.admin_password
  sensitive   = true
}

output "database_url" {
  description = "Ready-to-use DATABASE_URL for staging (sslmode=require)."
  value       = module.this.database_url
  sensitive   = true
}
