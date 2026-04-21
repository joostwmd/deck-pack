variable "location" {
  description = "Azure region for the storage account."
  type        = string
}

variable "resource_group_name" {
  description = "Existing resource group."
  type        = string
}

variable "storage_account_name" {
  description = "Globally unique storage account name (3–24 lowercase letters and digits)."
  type        = string

  validation {
    condition     = can(regex("^[a-z0-9]{3,24}$", var.storage_account_name))
    error_message = "storage_account_name must be 3–24 lowercase letters or digits only."
  }
}

variable "container_name" {
  description = "Blob container for user/admin uploads (private)."
  type        = string
  default     = "images"

  validation {
    condition     = length(var.container_name) >= 3 && length(var.container_name) <= 63
    error_message = "container_name must be 3–63 characters (Azure blob container rules)."
  }
}

variable "account_replication_type" {
  description = "Replication. LRS is the cheapest option."
  type        = string
  default     = "LRS"
}

variable "shared_access_key_enabled" {
  description = "When false, data plane uses Entra ID / user delegation SAS only (no account keys)."
  type        = bool
  default     = false
}

variable "cors_allowed_origins" {
  description = "HTTPS origins allowed to call Blob REST from the browser (e.g. Static Web App default URLs). Required for browser PUT via signed URL."
  type        = list(string)
  default     = []
}

variable "cors_allowed_methods" {
  description = "HTTP methods CORS may use against blob storage."
  type        = list(string)
  default     = ["GET", "HEAD", "PUT", "OPTIONS"]
}

variable "cors_allowed_headers" {
  type    = list(string)
  default = ["*"]
}

variable "cors_exposed_headers" {
  type    = list(string)
  default = ["*"]
}

variable "cors_max_age_seconds" {
  type    = number
  default = 3600
}

variable "blob_data_principal_ids" {
  description = "Object IDs (managed identities / users) granted Storage Blob Data Contributor on this account."
  type        = list(string)
}

variable "tags" {
  description = "Tags applied to all resources."
  type        = map(string)
  default     = {}
}
