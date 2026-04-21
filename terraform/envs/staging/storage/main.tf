data "terraform_remote_state" "static_web_apps" {
  backend = "azurerm"
  config = {
    resource_group_name  = "rg-deck-pack-tfstate"
    storage_account_name = "stdeckpacktfstatejw"
    container_name       = "tfstate"
    key                  = "staging-static-web-apps.tfstate"
    use_azuread_auth     = true
  }
}

data "terraform_remote_state" "app_service" {
  backend = "azurerm"
  config = {
    resource_group_name  = "rg-deck-pack-tfstate"
    storage_account_name = "stdeckpacktfstatejw"
    container_name       = "tfstate"
    key                  = "staging-app-service.tfstate"
    use_azuread_auth     = true
  }
}

module "this" {
  source = "../../../modules/storage"

  location                 = var.location
  resource_group_name      = var.resource_group_name
  storage_account_name     = var.storage_account_name
  container_name           = var.container_name
  account_replication_type = "LRS"

  cors_allowed_origins = concat(
    data.terraform_remote_state.static_web_apps.outputs.cors_origin_urls,
    var.cors_origins_extra,
  )

  blob_data_principal_ids = [
    data.terraform_remote_state.app_service.outputs.api_principal_id,
  ]

  tags = var.tags
}
