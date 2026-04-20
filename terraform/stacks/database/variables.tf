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
  description = "Existing resource group (provisioned by the foundation stack)."
  type        = string
  default     = "rg-deck-pack-cloud"
}

variable "server_name" {
  description = "Globally unique Postgres Flexible Server name. Lowercase, letters/numbers/hyphens, 3-63 chars."
  type        = string

  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$", var.server_name))
    error_message = "server_name must be 3-63 chars, lowercase letters/digits/hyphens, and cannot start/end with a hyphen."
  }
}

variable "postgres_version" {
  description = "PostgreSQL major version. 16 is the current default for new Azure Flexible Servers."
  type        = string
  default     = "16"
}

variable "sku_name" {
  description = "Flexible Server SKU. Burstable B1ms is the cheapest tier (1 vCPU, 2 GB RAM)."
  type        = string
  default     = "B_Standard_B1ms"
}

variable "storage_mb" {
  description = "Storage in MB. 32768 = 32 GB, the minimum for Flexible Server."
  type        = number
  default     = 32768

  validation {
    condition     = var.storage_mb >= 32768
    error_message = "storage_mb minimum is 32768 (32 GB)."
  }
}

variable "backup_retention_days" {
  description = "Backup retention in days. 7 is the minimum and cheapest."
  type        = number
  default     = 7
}

variable "admin_username" {
  description = "Postgres admin login. Azure reserves 'admin', 'administrator', 'root', 'guest', 'public', 'azure_superuser', 'azure_pg_admin'."
  type        = string
  default     = "pgadmin"
}

variable "database_name" {
  description = "Application database name created on the server."
  type        = string
  default     = "deck_pack"
}

variable "developer_ip" {
  description = "Optional public IPv4 of the developer machine to allow for local tools (drizzle-kit, psql). Plain IPv4 only — no CIDR. Leave null to deny all non-Azure access."
  type        = string
  default     = null

  validation {
    condition     = var.developer_ip == null || can(regex("^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$", var.developer_ip))
    error_message = "developer_ip must be a plain IPv4 address like 203.0.113.10 — no CIDR suffix (/32) and no stray characters."
  }
}

variable "tags" {
  description = "Tags applied to all resources."
  type        = map(string)
  default = {
    project = "deck-pack"
    managed = "terraform"
    scope   = "database"
  }
}
