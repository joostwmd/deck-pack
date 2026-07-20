module "ops" {
  source = "../../../modules/static-web-app"

  name                = "dp-swa-ops-staging-dpc"
  resource_group_name = var.resource_group_name
  location            = var.location
  tags                = merge(var.tags, { app = "ops" })
}

module "portal" {
  source = "../../../modules/static-web-app"

  name                = "dp-swa-portal-staging-dpc"
  resource_group_name = var.resource_group_name
  location            = var.location
  tags                = merge(var.tags, { app = "portal" })
}

module "assets" {
  source = "../../../modules/static-web-app"

  name                = "dp-swa-assets-staging-dpc"
  resource_group_name = var.resource_group_name
  location            = var.location
  tags                = merge(var.tags, { app = "addin-assets" })
}
