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

variable "email_api_key" {
  description = "Resend API key; stored as EMAIL_API_KEY for the API (Key Vault secret value)."
  type        = string
  sensitive   = true
}

variable "email_from" {
  description = "Resend-verified sender for outbound mail (Key Vault secret value)."
  type        = string
  sensitive   = true
}

variable "email_api_key_secret_name" {
  description = "Secret name used to store the Resend API key."
  type        = string
  default     = "email-api-key"
}

variable "email_from_secret_name" {
  description = "Secret name used to store the verified From address."
  type        = string
  default     = "email-from"
}

variable "pexels_api_key" {
  description = "Pexels API key for stock photo search (Key Vault secret value)."
  type        = string
  sensitive   = true
}

variable "pexels_api_key_secret_name" {
  description = "Secret name used to store the Pexels API key."
  type        = string
  default     = "pexels-api-key"
}

variable "brandfetch_api_key" {
  description = "Brandfetch API key for logo search (Key Vault secret value)."
  type        = string
  sensitive   = true
}

variable "brandfetch_api_key_secret_name" {
  description = "Secret name used to store the Brandfetch API key."
  type        = string
  default     = "brandfetch-api-key"
}

variable "brandfetch_client_id" {
  description = "Brandfetch client ID for logo search (Key Vault secret value)."
  type        = string
  sensitive   = true
}

variable "brandfetch_client_id_secret_name" {
  description = "Secret name used to store the Brandfetch client ID."
  type        = string
  default     = "brandfetch-client-id"
}

variable "noun_project_api_key" {
  description = "Noun Project OAuth1 consumer key (Key Vault secret value)."
  type        = string
  sensitive   = true
}

variable "noun_project_api_key_secret_name" {
  description = "Secret name used to store the Noun Project API key."
  type        = string
  default     = "noun-project-api-key"
}

variable "noun_project_api_secret" {
  description = "Noun Project OAuth1 consumer secret (Key Vault secret value)."
  type        = string
  sensitive   = true
}

variable "noun_project_api_secret_name" {
  description = "Secret name used to store the Noun Project API secret."
  type        = string
  default     = "noun-project-api-secret"
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
