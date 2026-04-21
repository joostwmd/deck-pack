output "key_vault_id" {
  description = "Resource ID of the Key Vault."
  value       = azurerm_key_vault.main.id
}

output "key_vault_uri" {
  description = "DNS URI of the Key Vault."
  value       = azurerm_key_vault.main.vault_uri
}

output "database_url_secret_uri" {
  description = "Versionless secret URI for DATABASE_URL (safe for Key Vault references)."
  value       = azurerm_key_vault_secret.database_url.versionless_id
}

output "better_auth_secret_uri" {
  description = "Versionless secret URI for BETTER_AUTH_SECRET (safe for Key Vault references)."
  value       = azurerm_key_vault_secret.better_auth_secret.versionless_id
}
