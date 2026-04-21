variable "location" {
  description = "Azure region for the App Service plan and web apps."
  type        = string
}

variable "resource_group_name" {
  description = "Existing resource group (provisioned by the foundation module)."
  type        = string
}

variable "plan_name" {
  description = "App Service plan name."
  type        = string
}

variable "plan_sku" {
  description = "App Service plan SKU. B1 is the cheapest Linux tier that supports custom containers."
  type        = string
  default     = "B1"
}

variable "plan_always_on" {
  description = "Keep apps warm. Disable to pay less on tiers that don't support it (Free/Shared)."
  type        = bool
  default     = true
}

variable "acr_id" {
  description = "Resource ID of the ACR to grant AcrPull on. From foundation module output `acr_id`."
  type        = string
}

variable "acr_login_server" {
  description = "ACR login server (e.g. deckpackacr12345.azurecr.io). From foundation module output `acr_login_server`."
  type        = string
}

variable "ops_app_name" {
  description = "Globally unique Linux Web App name for the OPS frontend. Becomes https://<name>.azurewebsites.net."
  type        = string

  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9-]{1,58}[a-z0-9]$", var.ops_app_name))
    error_message = "ops_app_name must be 2-60 chars, lowercase letters, digits, or hyphens, and cannot start/end with a hyphen."
  }
}

variable "ops_image_repository" {
  description = "Image repository name in ACR for the OPS app."
  type        = string
  default     = "deck-pack-ops"
}

variable "ops_image_tag" {
  description = "Image tag to deploy (e.g. `latest` or a git SHA)."
  type        = string
  default     = "latest"
}

variable "ops_container_port" {
  description = "Port the OPS container listens on (matches Dockerfile EXPOSE)."
  type        = number
  default     = 8080
}

variable "api_app_name" {
  description = "Globally unique Linux Web App name for the API backend. Becomes https://<name>.azurewebsites.net."
  type        = string

  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9-]{1,58}[a-z0-9]$", var.api_app_name))
    error_message = "api_app_name must be 2-60 chars, lowercase letters, digits, or hyphens, and cannot start/end with a hyphen."
  }
}

variable "api_image_repository" {
  description = "Image repository name in ACR for the API app."
  type        = string
  default     = "deck-pack-api"
}

variable "api_image_tag" {
  description = "Image tag to deploy (e.g. `latest` or a git SHA)."
  type        = string
  default     = "latest"
}

variable "api_container_port" {
  description = "Port the API container listens on (matches Dockerfile EXPOSE)."
  type        = number
  default     = 3000
}

variable "node_env" {
  description = "NODE_ENV for the API container. Keep 'production' even for staging — this controls library behaviour (error messages, perf), not which env the code thinks it's in."
  type        = string
  default     = "production"
}

variable "database_url_secret_uri" {
  description = "Versionless SecretUri for DATABASE_URL in Key Vault."
  type        = string
}

variable "better_auth_secret_uri" {
  description = "Versionless SecretUri for BETTER_AUTH_SECRET in Key Vault."
  type        = string
}

variable "key_vault_id" {
  description = "Resource ID of the Key Vault. If set, web apps receive Key Vault Secrets User role assignments."
  type        = string
  default     = null
}

variable "tags" {
  description = "Tags applied to all resources."
  type        = map(string)
  default     = {}
}
