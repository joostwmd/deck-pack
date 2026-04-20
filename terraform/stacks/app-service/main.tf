resource "azurerm_service_plan" "main" {
  name                = var.plan_name
  resource_group_name = var.resource_group_name
  location            = var.location
  os_type             = "Linux"
  sku_name            = var.plan_sku
  tags                = var.tags
}

resource "azurerm_linux_web_app" "ops" {
  name                = var.ops_app_name
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
      docker_image_name   = "${var.ops_image_repository}:${var.ops_image_tag}"
      docker_registry_url = "https://${var.acr_login_server}"
    }
  }

  app_settings = {
    WEBSITES_PORT                       = tostring(var.ops_container_port)
    WEBSITES_ENABLE_APP_SERVICE_STORAGE = "false"
  }

  lifecycle {
    # App Service writes runtime metadata into these on first successful pull.
    # Ignoring them prevents spurious diffs on subsequent plans.
    ignore_changes = [
      app_settings["DOCKER_REGISTRY_SERVER_URL"],
      app_settings["DOCKER_REGISTRY_SERVER_USERNAME"],
      app_settings["DOCKER_REGISTRY_SERVER_PASSWORD"],
    ]
  }
}

# Let the OPS web app pull images from ACR using its managed identity.
# (No ACR admin credentials, no stored passwords.)
resource "azurerm_role_assignment" "ops_acr_pull" {
  scope                = var.acr_id
  role_definition_name = "AcrPull"
  principal_id         = azurerm_linux_web_app.ops.identity[0].principal_id
}
