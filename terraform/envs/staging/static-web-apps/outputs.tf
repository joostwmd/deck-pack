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
