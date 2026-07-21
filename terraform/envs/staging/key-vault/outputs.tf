output "key_vault_id" {
  description = "Resource ID of the staging Key Vault."
  value       = module.this.key_vault_id
}

output "key_vault_uri" {
  description = "URI of the staging Key Vault."
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

output "email_api_key_secret_uri" {
  description = "Versionless secret URI for EMAIL_API_KEY (Resend)."
  value       = module.this.email_api_key_secret_uri
}

output "email_from_secret_uri" {
  description = "Versionless secret URI for EMAIL_FROM."
  value       = module.this.email_from_secret_uri
}

output "pexels_api_key_secret_uri" {
  description = "Versionless secret URI for PEXELS_API_KEY."
  value       = module.this.pexels_api_key_secret_uri
}

output "brandfetch_api_key_secret_uri" {
  description = "Versionless secret URI for BRANDFETCH_API_KEY."
  value       = module.this.brandfetch_api_key_secret_uri
}

output "brandfetch_client_id_secret_uri" {
  description = "Versionless secret URI for BRANDFETCH_CLIENT_ID."
  value       = module.this.brandfetch_client_id_secret_uri
}

output "noun_project_api_key_secret_uri" {
  description = "Versionless secret URI for NOUN_PROJECT_API_KEY."
  value       = module.this.noun_project_api_key_secret_uri
}

output "noun_project_api_secret_secret_uri" {
  description = "Versionless secret URI for NOUN_PROJECT_API_SECRET."
  value       = module.this.noun_project_api_secret_secret_uri
}
