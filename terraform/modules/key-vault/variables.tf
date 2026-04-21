variable "location" {
  description = "Azure region for the Key Vault resource."
  type        = string
}

variable "resource_group_name" {
  description = "Existing resource group that will contain the Key Vault."
  type        = string
}

variable "key_vault_name" {
  description = "Globally unique Key Vault name."
  type        = string
}

variable "database_url" {
  description = "DATABASE_URL value to store as a Key Vault secret."
  type        = string
  sensitive   = true
}

variable "database_url_secret_name" {
  description = "Secret name used to store DATABASE_URL."
  type        = string
  default     = "database-url"
}

variable "better_auth_secret_name" {
  description = "Secret name used to store BETTER_AUTH_SECRET."
  type        = string
  default     = "better-auth-secret"
}

variable "better_auth_secret_length" {
  description = "Length of the generated BETTER_AUTH_SECRET."
  type        = number
  default     = 48
}

variable "soft_delete_retention_days" {
  description = "Soft-delete retention in days for Key Vault (7-90)."
  type        = number
  default     = 7
}

variable "purge_protection_enabled" {
  description = "Enable purge protection. Keep false for cost-friendly iterative environments."
  type        = bool
  default     = false
}

variable "tags" {
  description = "Tags applied to Key Vault resources."
  type        = map(string)
  default     = {}
}
