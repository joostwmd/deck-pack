resource "azurerm_service_plan" "main" {
  name                = var.plan_name
  resource_group_name = var.resource_group_name
  location            = var.location
  os_type             = "Linux"
  sku_name            = var.plan_sku
  tags                = var.tags
}

resource "azurerm_linux_web_app" "api" {
  name                = var.api_app_name
  resource_group_name = var.resource_group_name
  location            = var.location
  service_plan_id     = azurerm_service_plan.main.id
  https_only          = true
  tags                = var.tags

  identity {
    type = "SystemAssigned"
  }

  site_config {
    always_on                               = var.plan_always_on
    container_registry_use_managed_identity = true
    ftps_state                              = "Disabled"
    http2_enabled                           = true
    minimum_tls_version                     = "1.2"

    application_stack {
      docker_image_name   = "${var.api_image_repository}:${var.api_image_tag}"
      docker_registry_url = "https://${var.acr_login_server}"
    }
  }

  app_settings = merge(
    {
      WEBSITES_PORT                       = tostring(var.api_container_port)
      WEBSITES_ENABLE_APP_SERVICE_STORAGE = "false"
      PORT                                = tostring(var.api_container_port)
      NODE_ENV                            = var.node_env
      DATABASE_URL                        = "@Microsoft.KeyVault(SecretUri=${var.database_url_secret_uri})"
      BETTER_AUTH_SECRET                  = "@Microsoft.KeyVault(SecretUri=${var.better_auth_secret_uri})"
      EMAIL_API_KEY                       = "@Microsoft.KeyVault(SecretUri=${var.email_api_key_secret_uri})"
      EMAIL_FROM                          = "@Microsoft.KeyVault(SecretUri=${var.email_from_secret_uri})"
      PEXELS_API_KEY                      = "@Microsoft.KeyVault(SecretUri=${var.pexels_api_key_secret_uri})"
      BRANDFETCH_API_KEY                  = "@Microsoft.KeyVault(SecretUri=${var.brandfetch_api_key_secret_uri})"
      BRANDFETCH_CLIENT_ID                = "@Microsoft.KeyVault(SecretUri=${var.brandfetch_client_id_secret_uri})"
      NOUN_PROJECT_API_KEY                = "@Microsoft.KeyVault(SecretUri=${var.noun_project_api_key_secret_uri})"
      NOUN_PROJECT_API_SECRET             = "@Microsoft.KeyVault(SecretUri=${var.noun_project_api_secret_secret_uri})"
      BETTER_AUTH_URL                     = "https://${var.api_app_name}.azurewebsites.net"
      CORS_ORIGINS                        = join(",", var.cors_origins)
      OPS_ORIGINS                         = join(",", var.ops_origins)
      PORTAL_APP_URL                      = var.portal_app_url
    },
    var.storage_account_name != null && var.storage_container_name != null ? {
      AZURE_STORAGE_ACCOUNT_NAME = var.storage_account_name
      AZURE_STORAGE_CONTAINER    = var.storage_container_name
    } : {},
  )

  lifecycle {
    ignore_changes = [
      app_settings["DOCKER_REGISTRY_SERVER_URL"],
      app_settings["DOCKER_REGISTRY_SERVER_USERNAME"],
      app_settings["DOCKER_REGISTRY_SERVER_PASSWORD"],
    ]
  }
}

resource "azurerm_role_assignment" "api_acr_pull" {
  scope                = var.acr_id
  role_definition_name = "AcrPull"
  principal_id         = azurerm_linux_web_app.api.identity[0].principal_id
}

resource "azurerm_role_assignment" "api_kv_secrets_user" {
  count                = var.key_vault_id == null ? 0 : 1
  scope                = var.key_vault_id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_linux_web_app.api.identity[0].principal_id
}
