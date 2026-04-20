# database stack

Provisions the managed Postgres server for the API.

## What it creates

- `azurerm_postgresql_flexible_server` — Postgres 16 Flexible Server on `B_Standard_B1ms` (1 vCPU, 2 GB RAM)
- `azurerm_postgresql_flexible_server_database` — application database `deck_pack`
- `azurerm_postgresql_flexible_server_firewall_rule "allow_azure_services"` — required for the App Service to connect without a VNet
- `azurerm_postgresql_flexible_server_firewall_rule "allow_developer"` — optional, only created if `developer_ip` is set
- Random 32-character admin password (stored in Terraform state, exposed only via sensitive outputs)

## Dependencies

- `terraform/stacks/foundation` — provides the resource group
- Azure subscription must have `Microsoft.DBforPostgreSQL` registered (one-time):

```bash
az provider register --namespace Microsoft.DBforPostgreSQL
az provider show --namespace Microsoft.DBforPostgreSQL --query registrationState -o tsv
# wait until it prints: Registered
```

## Apply

```bash
cp terraform/stacks/database/terraform.tfvars.example terraform/stacks/database/terraform.tfvars
# edit terraform.tfvars: set subscription_id and a unique server_name
pnpm tf:init:database
pnpm tf:plan:database
pnpm tf:apply:database
```

Apply takes ~5–8 minutes. Postgres Flexible Server provisioning is the slowest Azure resource in this project so far.

## Retrieving secrets after apply

```bash
# Admin password (for manual psql / drizzle-kit migrations):
terraform -chdir=terraform/stacks/database output -raw admin_password

# Ready-to-use connection string for the API:
terraform -chdir=terraform/stacks/database output -raw database_url
```

The `database_url` output is formatted as `postgresql://<user>:<password>@<fqdn>:5432/<db>?sslmode=require`, which is what Drizzle expects.

## Running migrations from the laptop

1. Set `developer_ip` in `terraform.tfvars` to your current public IPv4 (`curl -s ifconfig.me`).
2. `pnpm tf:apply:database` to open the firewall.
3. Export the connection string and run Drizzle:

```bash
export DATABASE_URL="$(terraform -chdir=terraform/stacks/database output -raw database_url)"
pnpm db:push      # or: pnpm db:migrate after generating migrations
```

4. Close the firewall hole afterwards by unsetting `developer_ip` and re-applying, if you don't want long-lived laptop access.

## Cost

- Compute `B_Standard_B1ms`: ~€13/month
- Storage 32 GB: ~€3/month
- Backup: first 32 GB included
- **~€16/month total**, billed hourly — can be paused (`az postgres flexible-server stop`) between dev sessions.
