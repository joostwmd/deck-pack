variable "subscription_id" {
  description = "Azure subscription ID."
  type        = string
}

variable "location" {
  description = "Azure region."
  type        = string
  default     = "westeurope"
}

variable "resource_group_name" {
  description = "Existing resource group."
  type        = string
  default     = "rg-deck-pack-cloud"
}

variable "storage_account_name" {
  description = "Globally unique name for the staging uploads storage account."
  type        = string
}

variable "container_name" {
  description = "Blob container name (default images)."
  type        = string
  default     = "images"
}

variable "cors_origins_extra" {
  description = "Extra CORS origins appended after staging Static Web App URLs."
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Tags applied to all resources."
  type        = map(string)
  default = {
    project = "deck-pack"
    env     = "staging"
    managed = "terraform"
    scope   = "storage-uploads"
  }
}
