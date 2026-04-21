output "key_vault_id" {
  description = "Resource ID of the prod Key Vault."
  value       = module.this.key_vault_id
}

output "key_vault_uri" {
  description = "URI of the prod Key Vault."
  value       = module.this.key_vault_uri
}

output "database_url_secret_uri" {
  description = "Versionless secret URI for DATABASE_URL."
  value       = module.this.database_url_secret_uri
}

output "better_auth_secret_uri" {
  description = "Versionless secret URI for BETTER_AUTH_SECRET."
  value       = module.this.better_auth_secret_uri
}
