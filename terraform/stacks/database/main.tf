resource "random_password" "admin" {
  # Only URL-safe specials so the generated password can be embedded verbatim
  # in the postgresql:// connection string without percent-encoding. The `pg`
  # Node driver parses the URL via WHATWG URL, which rejects unreserved-set
  # violations like `{`, `}`, `?`, `#`, `*`, `(`, `)` in userinfo.
  length           = 32
  special          = true
  override_special = "-_"
  min_special      = 2
  min_upper        = 1
  min_lower        = 1
  min_numeric      = 1
}

resource "azurerm_postgresql_flexible_server" "main" {
  name                = var.server_name
  resource_group_name = var.resource_group_name
  location            = var.location
  version             = var.postgres_version

  administrator_login    = var.admin_username
  administrator_password = random_password.admin.result

  sku_name   = var.sku_name
  storage_mb = var.storage_mb

  backup_retention_days        = var.backup_retention_days
  geo_redundant_backup_enabled = false

  public_network_access_enabled = true

  # Intentionally omit `zone` so Azure places the server in whichever AZ has
  # capacity. Student / free subscriptions frequently get
  # "AvailabilityZoneNotAvailable" when pinning a specific zone in West Europe.
  authentication {
    password_auth_enabled = true
  }

  tags = var.tags

  lifecycle {
    # Azure may shuffle the actual AZ between maintenance events; ignore to
    # avoid spurious diffs when Azure reports a different value than planned.
    ignore_changes = [zone]
  }
}

# Azure's special "allow all Azure services" firewall rule (0.0.0.0/0.0.0.0).
# Required for the App Service outbound IPs to reach the server without a VNet.
resource "azurerm_postgresql_flexible_server_firewall_rule" "allow_azure_services" {
  name             = "allow-azure-services"
  server_id        = azurerm_postgresql_flexible_server.main.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}

resource "azurerm_postgresql_flexible_server_firewall_rule" "allow_developer" {
  count            = var.developer_ip == null ? 0 : 1
  name             = "allow-developer"
  server_id        = azurerm_postgresql_flexible_server.main.id
  start_ip_address = var.developer_ip
  end_ip_address   = var.developer_ip
}

resource "azurerm_postgresql_flexible_server_database" "app" {
  name      = var.database_name
  server_id = azurerm_postgresql_flexible_server.main.id
  collation = "en_US.utf8"
  charset   = "utf8"
}
