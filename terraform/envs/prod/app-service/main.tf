# Read ACR details from the shared foundation state. This replaces the old
# pattern of copy-pasting acr_id / acr_login_server into tfvars.
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

# Read Key Vault references from prod/key-vault state. App Service receives
# only secret URIs, not plaintext values.
data "terraform_remote_state" "key_vault" {
  backend = "azurerm"
  config = {
    resource_group_name  = "rg-deck-pack-tfstate"
    storage_account_name = "stdeckpacktfstatejw"
    container_name       = "tfstate"
    key                  = "prod-key-vault.tfstate"
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

  database_url_secret_uri = data.terraform_remote_state.key_vault.outputs.database_url_secret_uri
  better_auth_secret_uri  = data.terraform_remote_state.key_vault.outputs.better_auth_secret_uri
  key_vault_id            = data.terraform_remote_state.key_vault.outputs.key_vault_id

  tags = var.tags
}
