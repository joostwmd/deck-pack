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
  source = "../../../modules/key-vault"

  location            = var.location
  resource_group_name = var.resource_group_name
  key_vault_name      = var.key_vault_name

  database_url             = data.terraform_remote_state.database.outputs.database_url
  database_url_secret_name = var.database_url_secret_name
  better_auth_secret_name  = var.better_auth_secret_name

  email_api_key             = var.email_api_key
  email_from                = var.email_from
  email_api_key_secret_name = var.email_api_key_secret_name
  email_from_secret_name    = var.email_from_secret_name

  purge_protection_enabled = var.purge_protection_enabled
  tags                     = var.tags
}
