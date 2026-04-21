output "profile_id" {
  description = "Front Door profile resource ID. Used downstream to configure App Service origin lockdown via X-Azure-FDID."
  value       = azurerm_cdn_frontdoor_profile.main.id
}

output "profile_resource_guid" {
  description = "Front Door profile resource GUID. App Service origin lockdown validates inbound traffic using this GUID as the X-Azure-FDID header value."
  value       = azurerm_cdn_frontdoor_profile.main.resource_guid
}

output "ops_endpoint_hostname" {
  description = "Public hostname of the OPS endpoint (e.g. ops-prod-jw-xxxx.z01.azurefd.net)."
  value       = azurerm_cdn_frontdoor_endpoint.ops.host_name
}

output "ops_endpoint_url" {
  description = "Public URL of the OPS endpoint."
  value       = "https://${azurerm_cdn_frontdoor_endpoint.ops.host_name}"
}

output "api_endpoint_hostname" {
  description = "Public hostname of the API endpoint. Bake this into VITE_SERVER_URL when building the OPS image so auth and tRPC calls flow through AFD (and thus through the WAF)."
  value       = azurerm_cdn_frontdoor_endpoint.api.host_name
}

output "api_endpoint_url" {
  description = "Public URL of the API endpoint."
  value       = "https://${azurerm_cdn_frontdoor_endpoint.api.host_name}"
}

output "waf_policy_id" {
  description = "WAF firewall policy ID, for later rule overrides or custom-rule additions."
  value       = azurerm_cdn_frontdoor_firewall_policy.main.id
}
