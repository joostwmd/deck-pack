output "cors_origin_urls" {
  description = "Staging frontend origins for API CORS / Better Auth."
  value = [
    module.ops.default_url,
    module.portal.default_url,
    module.assets.default_url,
  ]
}

output "ops_default_host_name" {
  value = module.ops.default_host_name
}

output "ops_default_url" {
  description = "OPS Static Web App HTTPS URL (for API OPS_ORIGINS)."
  value       = module.ops.default_url
}

output "portal_default_url" {
  description = "Portal Static Web App HTTPS URL (for API PORTAL_APP_URL invitation links)."
  value       = module.portal.default_url
}

output "ops_deployment_token" {
  value     = module.ops.api_key
  sensitive = true
}

output "portal_deployment_token" {
  value     = module.portal.api_key
  sensitive = true
}

output "assets_deployment_token" {
  value     = module.assets.api_key
  sensitive = true
}
