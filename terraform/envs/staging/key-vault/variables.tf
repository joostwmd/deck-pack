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
  description = "Globally unique Key Vault name for staging."
  type        = string
  default     = "kv-deck-pack-staging-jw"
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

variable "pexels_api_key" {
  description = "Pexels API key (TF_VAR_pexels_api_key; matches PEXELS_API_KEY in apps/api/.env)."
  type        = string
  sensitive   = true
}

variable "brandfetch_api_key" {
  description = "Brandfetch API key (TF_VAR_brandfetch_api_key; matches BRANDFETCH_API_KEY in apps/api/.env)."
  type        = string
  sensitive   = true
}

variable "brandfetch_client_id" {
  description = "Brandfetch client ID (TF_VAR_brandfetch_client_id; matches BRANDFETCH_CLIENT_ID in apps/api/.env)."
  type        = string
  sensitive   = true
}

variable "noun_project_api_key" {
  description = "Noun Project API key (TF_VAR_noun_project_api_key; matches NOUN_PROJECT_API_KEY in apps/api/.env)."
  type        = string
  sensitive   = true
}

variable "noun_project_api_secret" {
  description = "Noun Project API secret (TF_VAR_noun_project_api_secret; matches NOUN_PROJECT_API_SECRET in apps/api/.env)."
  type        = string
  sensitive   = true
}

variable "pexels_api_key_secret_name" {
  description = "Key Vault secret name for the Pexels API key."
  type        = string
  default     = "pexels-api-key"
}

variable "brandfetch_api_key_secret_name" {
  description = "Key Vault secret name for the Brandfetch API key."
  type        = string
  default     = "brandfetch-api-key"
}

variable "brandfetch_client_id_secret_name" {
  description = "Key Vault secret name for the Brandfetch client ID."
  type        = string
  default     = "brandfetch-client-id"
}

variable "noun_project_api_key_secret_name" {
  description = "Key Vault secret name for the Noun Project API key."
  type        = string
  default     = "noun-project-api-key"
}

variable "noun_project_api_secret_name" {
  description = "Key Vault secret name for the Noun Project API secret."
  type        = string
  default     = "noun-project-api-secret"
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
    env     = "staging"
    managed = "terraform"
    scope   = "key-vault"
  }
}
