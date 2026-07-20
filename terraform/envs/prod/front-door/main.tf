# Read OPS (Static Web App) + API (App Service) hostnames. AFD needs them to
# configure its origins.
#
# The reverse dependency (app-service reading AFD's profile_resource_guid to
# lock origins to AFD-only) is intentionally NOT set up yet — doing so would
# create a circular data dependency at bootstrap time. Origin lockdown is a
# follow-up: set the AFD ID as a tfvar in prod/app-service once this stack
# has been applied at least once.
data "terraform_remote_state" "app_service" {
  backend = "azurerm"
  config = {
    resource_group_name  = "rg-deck-pack-tfstate"
    storage_account_name = "stdeckpacktfstatedpc"
    container_name       = "tfstate"
    # Prod app-service was created under the legacy (unprefixed) state key.
    # See terraform/envs/prod/app-service/versions.tf.
    key              = "app-service.tfstate"
    use_azuread_auth = true
  }
}

data "terraform_remote_state" "static_web_apps" {
  backend = "azurerm"
  config = {
    resource_group_name  = "rg-deck-pack-tfstate"
    storage_account_name = "stdeckpacktfstatedpc"
    container_name       = "tfstate"
    key                  = "prod-static-web-apps.tfstate"
    use_azuread_auth     = true
  }
}

module "this" {
  source = "../../../modules/front-door"

  resource_group_name = var.resource_group_name
  profile_name        = var.profile_name
  endpoint_suffix     = var.endpoint_suffix

  ops_origin_hostname = data.terraform_remote_state.static_web_apps.outputs.ops_default_host_name
  api_origin_hostname = data.terraform_remote_state.app_service.outputs.api_default_hostname

  waf_mode = var.waf_mode
  tags     = var.tags
}
