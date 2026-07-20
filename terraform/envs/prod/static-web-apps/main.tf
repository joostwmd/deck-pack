module "ops" {
  source = "../../../modules/static-web-app"

  name                = "dp-swa-ops-prod-dpc"
  resource_group_name = var.resource_group_name
  location            = var.location
  tags                = merge(var.tags, { app = "ops" })
}

module "portal" {
  source = "../../../modules/static-web-app"

  name                = "dp-swa-portal-prod-dpc"
  resource_group_name = var.resource_group_name
  location            = var.location
  tags                = merge(var.tags, { app = "portal" })
}

module "assets" {
  source = "../../../modules/static-web-app"

  name                = "dp-swa-assets-prod-dpc"
  resource_group_name = var.resource_group_name
  location            = var.location
  tags                = merge(var.tags, { app = "addin-assets" })
}
