variable "resource_group_name" {
  description = "Resource group that owns the AFD profile and WAF policy."
  type        = string
}

variable "profile_name" {
  description = "Globally unique name of the Front Door profile. One profile can host many endpoints at the same base cost, so we share a single profile per AFD deployment."
  type        = string
}

variable "endpoint_suffix" {
  description = "Discriminator appended to each endpoint name (e.g. 'prod-jw'). Endpoint names must be globally unique across AFD; the suffix keeps prod/staging endpoints disjoint even if we reuse this module for staging later."
  type        = string
}

variable "ops_origin_hostname" {
  description = "Origin hostname for the OPS frontend (Static Web App, e.g. xxx.azurestaticapps.net)."
  type        = string
}

variable "api_origin_hostname" {
  description = "Origin hostname for the API backend (e.g. deck-pack-api-jw.azurewebsites.net). Read from the app-service remote state in the caller."
  type        = string
}

variable "waf_mode" {
  description = "WAF enforcement mode. 'Detection' only logs, 'Prevention' blocks. Start in Prevention; flip to Detection if the managed ruleset fights you during an incident."
  type        = string
  default     = "Prevention"

  validation {
    condition     = contains(["Detection", "Prevention"], var.waf_mode)
    error_message = "waf_mode must be 'Detection' or 'Prevention'."
  }
}

variable "rate_limit_threshold_per_minute" {
  description = "Per-IP request quota inside a 1-minute window. Requests above the threshold are blocked for the remainder of the window. 100/min is comfortable for human use and the OPS SPA's chatty tRPC calls, but will stop most scraping bots and credential-stuffing runs."
  type        = number
  default     = 100
}

variable "tags" {
  description = "Tags applied to every AFD resource in this module."
  type        = map(string)
  default     = {}
}
