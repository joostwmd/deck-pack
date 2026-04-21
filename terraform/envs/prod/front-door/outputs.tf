output "profile_id" {
  description = "Front Door profile resource ID."
  value       = module.this.profile_id
}

output "profile_resource_guid" {
  description = "Front Door profile resource GUID — the value of the X-Azure-FDID header AFD attaches to origin requests. Use this as a tfvar in prod/app-service to lock origins down to AFD-only."
  value       = module.this.profile_resource_guid
}

output "ops_endpoint_hostname" {
  description = "Public hostname of the OPS endpoint."
  value       = module.this.ops_endpoint_hostname
}

output "ops_endpoint_url" {
  description = "Public URL of the OPS endpoint."
  value       = module.this.ops_endpoint_url
}

output "api_endpoint_hostname" {
  description = "Public hostname of the API endpoint. Bake this into VITE_SERVER_URL when building the OPS image so auth and tRPC calls flow through AFD."
  value       = module.this.api_endpoint_hostname
}

output "api_endpoint_url" {
  description = "Public URL of the API endpoint."
  value       = module.this.api_endpoint_url
}

output "waf_policy_id" {
  description = "WAF firewall policy ID."
  value       = module.this.waf_policy_id
}
