output "cors_origin_urls" {
  description = "All frontend origins the API must allow (HTTPS). Pass to app-service as CORS_ORIGINS."
  value = [
    module.ops.default_url,
    module.portal.default_url,
    module.assets.default_url,
  ]
}

output "ops_default_host_name" {
  description = "OPS Static Web App hostname (for Front Door or DNS)."
  value       = module.ops.default_host_name
}

output "ops_deployment_token" {
  description = "GitHub Actions secret value: create repo secret SWA_TOKEN_OPS_PROD with this output."
  value       = module.ops.api_key
  sensitive   = true
}

output "portal_deployment_token" {
  description = "GitHub Actions secret SWA_TOKEN_PORTAL_PROD."
  value       = module.portal.api_key
  sensitive   = true
}

output "assets_deployment_token" {
  description = "GitHub Actions secret SWA_TOKEN_ASSETS_PROD."
  value       = module.assets.api_key
  sensitive   = true
}
