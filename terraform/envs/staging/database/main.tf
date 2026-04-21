module "this" {
  source = "../../../modules/database"

  location              = var.location
  resource_group_name   = var.resource_group_name
  server_name           = var.server_name
  postgres_version      = var.postgres_version
  sku_name              = var.sku_name
  storage_mb            = var.storage_mb
  backup_retention_days = var.backup_retention_days
  admin_username        = var.admin_username
  database_name         = var.database_name
  developer_ip          = var.developer_ip
  tags                  = var.tags
}
