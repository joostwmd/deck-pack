variable "subscription_id" {
  description = "Azure subscription ID."
  type        = string
}

variable "location" {
  description = "Azure region for the AFD profile. AFD is a global service; the location is used only for the profile resource itself (metadata)."
  type        = string
  default     = "global"
}

variable "resource_group_name" {
  description = "Resource group that will own the Front Door profile and WAF policy."
  type        = string
  default     = "rg-deck-pack-cloud"
}

variable "profile_name" {
  description = "Name of the AFD profile. Kept short and globally unique-ish via the -jw suffix."
  type        = string
  default     = "afd-deck-pack-jw"
}

variable "endpoint_suffix" {
  description = "Suffix appended to each endpoint name (e.g. 'prod-jw'). Endpoint names must be globally unique across all of AFD, so a personal/project suffix is mandatory."
  type        = string
  default     = "prod-jw"
}

variable "waf_mode" {
  description = "WAF mode: 'Detection' logs only, 'Prevention' blocks."
  type        = string
  default     = "Prevention"
}

variable "tags" {
  description = "Tags applied to the AFD profile and WAF policy."
  type        = map(string)
  default = {
    project = "deck-pack"
    env     = "prod"
    managed = "terraform"
    scope   = "front-door"
  }
}
