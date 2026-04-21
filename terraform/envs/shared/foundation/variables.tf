variable "subscription_id" {
  description = "Azure subscription ID where resources are created."
  type        = string
}

variable "location" {
  description = "Primary Azure region."
  type        = string
  default     = "westeurope"
}

variable "resource_group_name" {
  description = "Resource group for shared cloud resources."
  type        = string
  default     = "rg-deck-pack-cloud"
}

variable "acr_name" {
  description = "Global unique Azure Container Registry name (5-50 lowercase letters/numbers)."
  type        = string
}

variable "acr_sku" {
  description = "ACR SKU. Basic is enough to start."
  type        = string
  default     = "Basic"
}

variable "tags" {
  description = "Tags applied to all resources."
  type        = map(string)
  default = {
    project = "deck-pack"
    managed = "terraform"
  }
}
