variable "subscription_id" {
  description = "Azure subscription ID."
  type        = string
}

variable "location" {
  description = "Azure region."
  type        = string
  default     = "northeurope"
}

variable "resource_group_name" {
  description = "Existing resource group (provisioned by shared/foundation)."
  type        = string
  default     = "rg-deck-pack-cloud"
}

variable "server_name" {
  description = "Globally unique Postgres Flexible Server name."
  type        = string
}

variable "postgres_version" {
  description = "PostgreSQL major version."
  type        = string
  default     = "16"
}

variable "sku_name" {
  description = "Flexible Server SKU."
  type        = string
  default     = "B_Standard_B1ms"
}

variable "storage_mb" {
  description = "Storage in MB."
  type        = number
  default     = 32768
}

variable "backup_retention_days" {
  description = "Backup retention in days."
  type        = number
  default     = 7
}

variable "admin_username" {
  description = "Postgres admin login."
  type        = string
  default     = "pgadmin"
}

variable "database_name" {
  description = "Application database name."
  type        = string
  default     = "deck_pack"
}

variable "developer_ip" {
  description = "Optional public IPv4 of the developer machine to allow for local tools."
  type        = string
  default     = null
}

variable "tags" {
  description = "Tags applied to all resources."
  type        = map(string)
  default = {
    project = "deck-pack"
    env     = "prod"
    managed = "terraform"
    scope   = "database"
  }
}
