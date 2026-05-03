variable "subscription_id" {
  description = "Azure subscription ID."
  type        = string
}

variable "location" {
  description = "Azure region for Key Vault."
  type        = string
  default     = "westeurope"
}

variable "resource_group_name" {
  description = "Existing resource group."
  type        = string
  default     = "rg-deck-pack-cloud"
}

variable "key_vault_name" {
  description = "Globally unique Key Vault name for prod."
  type        = string
  default     = "kv-deck-pack-prod-jw"
}

variable "database_url_secret_name" {
  description = "Secret name for DATABASE_URL."
  type        = string
  default     = "database-url"
}

variable "better_auth_secret_name" {
  description = "Secret name for BETTER_AUTH_SECRET."
  type        = string
  default     = "better-auth-secret"
}

variable "email_api_key" {
  description = "Resend API key (pass via TF_VAR_email_api_key or -var-file; matches apps/api .env EMAIL_API_KEY)."
  type        = string
  sensitive   = true
}

variable "email_from" {
  description = "Verified Resend From address (TF_VAR_email_from; matches EMAIL_FROM in apps/api .env)."
  type        = string
  sensitive   = true
}

variable "email_api_key_secret_name" {
  description = "Key Vault secret name for the Resend API key."
  type        = string
  default     = "email-api-key"
}

variable "email_from_secret_name" {
  description = "Key Vault secret name for the From address."
  type        = string
  default     = "email-from"
}

variable "purge_protection_enabled" {
  description = "Enable purge protection for the vault."
  type        = bool
  default     = false
}

variable "tags" {
  description = "Tags applied to all resources."
  type        = map(string)
  default = {
    project = "deck-pack"
    env     = "prod"
    managed = "terraform"
    scope   = "key-vault"
  }
}
