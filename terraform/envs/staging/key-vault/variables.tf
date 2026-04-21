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
