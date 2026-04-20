data "terraform_remote_state" "shared_foundation" {
  backend = "azurerm"
  config = {
    resource_group_name  = "rg-deck-pack-tfstate"
    storage_account_name = "stdeckpacktfstatejw"
    container_name       = "tfstate"
    key                  = "foundation.tfstate"
    use_azuread_auth     = true
  }
}

# Reads the STAGING database state (not prod).
data "terraform_remote_state" "database" {
  backend = "azurerm"
  config = {
    resource_group_name  = "rg-deck-pack-tfstate"
    storage_account_name = "stdeckpacktfstatejw"
    container_name       = "tfstate"
    key                  = "staging-database.tfstate"
    use_azuread_auth     = true
  }
}

module "this" {
  source = "../../../modules/app-service"

  location            = var.location
  resource_group_name = var.resource_group_name

  plan_name      = var.plan_name
  plan_sku       = var.plan_sku
  plan_always_on = var.plan_always_on

  acr_id           = data.terraform_remote_state.shared_foundation.outputs.acr_id
  acr_login_server = data.terraform_remote_state.shared_foundation.outputs.acr_login_server

  ops_app_name         = var.ops_app_name
  ops_image_repository = var.ops_image_repository
  ops_image_tag        = var.ops_image_tag

  api_app_name         = var.api_app_name
  api_image_repository = var.api_image_repository
  api_image_tag        = var.api_image_tag

  database_url = data.terraform_remote_state.database.outputs.database_url

  tags = var.tags
}
