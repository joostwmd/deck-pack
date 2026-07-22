data "terraform_remote_state" "shared_foundation" {
  backend = "azurerm"
  config = {
    resource_group_name  = "rg-deck-pack-tfstate"
    storage_account_name = "stdeckpacktfstatedpc"
    container_name       = "tfstate"
    key                  = "foundation.tfstate"
    use_azuread_auth     = true
  }
}

data "terraform_remote_state" "key_vault" {
  backend = "azurerm"
  config = {
    resource_group_name  = "rg-deck-pack-tfstate"
    storage_account_name = "stdeckpacktfstatedpc"
    container_name       = "tfstate"
    key                  = "staging-key-vault.tfstate"
    use_azuread_auth     = true
  }
}

data "terraform_remote_state" "static_web_apps" {
  backend = "azurerm"
  config = {
    resource_group_name  = "rg-deck-pack-tfstate"
    storage_account_name = "stdeckpacktfstatedpc"
    container_name       = "tfstate"
    key                  = "staging-static-web-apps.tfstate"
    use_azuread_auth     = true
  }
}

data "terraform_remote_state" "storage" {
  count = var.wire_storage ? 1 : 0

  backend = "azurerm"
  config = {
    resource_group_name  = "rg-deck-pack-tfstate"
    storage_account_name = "stdeckpacktfstatedpc"
    container_name       = "tfstate"
    key                  = "staging-storage.tfstate"
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

  api_app_name         = var.api_app_name
  api_image_repository = var.api_image_repository
  api_image_tag        = var.api_image_tag

  cors_origins = concat(
    data.terraform_remote_state.static_web_apps.outputs.cors_origin_urls,
    var.cors_origins_extra,
  )

  portal_app_url = data.terraform_remote_state.static_web_apps.outputs.portal_default_url

  database_url_secret_uri  = data.terraform_remote_state.key_vault.outputs.database_url_secret_uri
  better_auth_secret_uri   = data.terraform_remote_state.key_vault.outputs.better_auth_secret_uri
  email_api_key_secret_uri = data.terraform_remote_state.key_vault.outputs.email_api_key_secret_uri
  email_from_secret_uri    = data.terraform_remote_state.key_vault.outputs.email_from_secret_uri
  pexels_api_key_secret_uri            = data.terraform_remote_state.key_vault.outputs.pexels_api_key_secret_uri
  brandfetch_api_key_secret_uri        = data.terraform_remote_state.key_vault.outputs.brandfetch_api_key_secret_uri
  brandfetch_client_id_secret_uri      = data.terraform_remote_state.key_vault.outputs.brandfetch_client_id_secret_uri
  noun_project_api_key_secret_uri      = data.terraform_remote_state.key_vault.outputs.noun_project_api_key_secret_uri
  noun_project_api_secret_secret_uri   = data.terraform_remote_state.key_vault.outputs.noun_project_api_secret_secret_uri
  key_vault_id             = data.terraform_remote_state.key_vault.outputs.key_vault_id

  ops_origins = ["https://${data.terraform_remote_state.static_web_apps.outputs.ops_default_host_name}"]

  storage_account_name   = var.wire_storage ? data.terraform_remote_state.storage[0].outputs.storage_account_name : null
  storage_container_name = var.wire_storage ? data.terraform_remote_state.storage[0].outputs.container_name : null

  tags = var.tags
}
