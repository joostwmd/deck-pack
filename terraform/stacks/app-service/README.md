# app-service stack

Provisions the runtime surface for containerized apps.

## What it creates

- `azurerm_service_plan` (Linux, shared by future apps like the API)
- `azurerm_linux_web_app` for the OPS frontend
  - system-assigned managed identity
  - container config pointing at `deck-pack-ops:<tag>` in the ACR from the foundation stack
  - `WEBSITES_PORT=8080` to match the Dockerfile
- `azurerm_role_assignment` granting the web app `AcrPull` on the ACR

## Dependencies

Run these in order if starting clean:

1. `terraform/stacks/foundation` — needs to exist so the RG and ACR are there.
2. `terraform/stacks/ci-identity` — unrelated at runtime, but must have produced at least one image with the tag referenced below in ACR.
3. `terraform/stacks/app-service` — this stack.

## Inputs to fill in `terraform.tfvars`

From the foundation stack:

```bash
terraform -chdir=../foundation output -raw acr_id
terraform -chdir=../foundation output -raw acr_login_server
```

You also need a globally unique `ops_app_name` for the `*.azurewebsites.net` URL.

## Apply

From the repo root:

```bash
pnpm tf:init:app-service
pnpm tf:plan:app-service
pnpm tf:apply:app-service
```

## Notes

- **First pull can take 1–3 minutes** after apply. The AcrPull role assignment needs a moment to propagate, and App Service retries automatically. The web app will return 5xx briefly before the image starts serving.
- **Tag strategy**: `ops_image_tag` defaults to `latest`, which is only advanced by merges to `main` in the CI workflow. To deploy a specific commit, set `ops_image_tag` to a 7-char git SHA instead — that's the production-grade pattern.
- **Updating the image**: changing `ops_image_tag` and running `terraform apply` triggers a new pull. For `:latest` re-deploys, you can also run `az webapp restart -g rg-deck-pack-cloud -n <ops_app_name>` to force a pull without a Terraform change.
