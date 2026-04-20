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

  validation {
    condition     = can(regex("^[a-z0-9]{5,50}$", var.acr_name))
    error_message = "acr_name must be 5-50 chars and only lowercase letters/numbers."
  }
}

variable "acr_sku" {
  description = "ACR SKU. Basic is enough to start."
  type        = string
  default     = "Basic"

  validation {
    condition     = contains(["Basic", "Standard", "Premium"], var.acr_sku)
    error_message = "acr_sku must be Basic, Standard, or Premium."
  }
}

variable "tags" {
  description = "Tags applied to all resources."
  type        = map(string)
  default = {
    project = "deck-pack"
    managed = "terraform"
  }
}
