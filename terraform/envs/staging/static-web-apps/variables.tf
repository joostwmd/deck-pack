variable "subscription_id" {
  description = "Azure subscription ID."
  type        = string
}

variable "location" {
  description = "Azure region for Static Web Apps."
  type        = string
  default     = "westeurope"
}

variable "resource_group_name" {
  description = "Existing resource group."
  type        = string
  default     = "rg-deck-pack-cloud"
}

variable "tags" {
  description = "Tags applied to all Static Web Apps."
  type        = map(string)
  default = {
    project = "deck-pack"
    env     = "staging"
    managed = "terraform"
    scope   = "static-web-apps"
  }
}
