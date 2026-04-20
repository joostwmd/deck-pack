module "this" {
  source = "../../../modules/foundation"

  location            = var.location
  resource_group_name = var.resource_group_name
  acr_name            = var.acr_name
  acr_sku             = var.acr_sku
  tags                = var.tags
}
