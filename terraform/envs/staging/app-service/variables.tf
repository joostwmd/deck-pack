variable "subscription_id" {
  description = "Azure subscription ID."
  type        = string
}

variable "location" {
  description = "Azure region for the App Service plan and web apps."
  type        = string
  default     = "westeurope"
}

variable "resource_group_name" {
  description = "Existing resource group."
  type        = string
  default     = "rg-deck-pack-cloud"
}

variable "plan_name" {
  description = "App Service plan name."
  type        = string
}

variable "plan_sku" {
  description = "App Service plan SKU."
  type        = string
  default     = "B1"
}

variable "plan_always_on" {
  description = "Keep apps warm."
  type        = bool
  default     = true
}

variable "api_app_name" {
  description = "Globally unique Linux Web App name for the API backend."
  type        = string
}

variable "api_image_repository" {
  description = "Image repository name in ACR for the API app. Same image as prod; only VITE_SERVER_URL differs (and that's OPS-only)."
  type        = string
  default     = "deck-pack-api"
}

variable "api_image_tag" {
  description = "Image tag to deploy."
  type        = string
  default     = "latest"
}

variable "cors_origins_extra" {
  description = "Optional extra origins appended after staging Static Web App URLs."
  type        = list(string)
  default     = []
}

variable "wire_storage" {
  description = "When true, read staging/storage state and set AZURE_STORAGE_* on the API. Apply staging/storage first, then enable."
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
    scope   = "app-service"
  }
}
