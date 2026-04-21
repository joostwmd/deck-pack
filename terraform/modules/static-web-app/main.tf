resource "azurerm_static_web_app" "this" {
  name                = var.name
  resource_group_name = var.resource_group_name
  location            = var.location
  sku_tier            = var.sku_tier
  sku_size            = var.sku_size
  tags                = var.tags

  # When deploying from GitHub Actions with the deployment token, Azure updates
  # these fields on the service side. Ignoring them prevents Terraform from
  # fighting the SWA deploy action on every push.
  lifecycle {
    ignore_changes = [
      repository_url,
      repository_branch,
    ]
  }
}
