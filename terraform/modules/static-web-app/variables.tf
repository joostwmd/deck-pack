variable "name" {
  description = "Globally unique name of the Static Web App."
  type        = string
}

variable "resource_group_name" {
  description = "Resource group that will contain the Static Web App."
  type        = string
}

variable "location" {
  description = "Azure region for the Static Web App."
  type        = string
}

variable "sku_tier" {
  description = "SKU tier. Use Free for lowest cost; Standard adds staging slots and higher limits."
  type        = string
  default     = "Free"
}

variable "sku_size" {
  description = "SKU size (must match tier: Free/Free or Standard/Standard)."
  type        = string
  default     = "Free"
}

variable "tags" {
  description = "Tags applied to the Static Web App."
  type        = map(string)
  default     = {}
}
