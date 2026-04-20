output "plan_id" {
  value = module.this.plan_id
}

output "plan_name" {
  value = module.this.plan_name
}

output "ops_app_name" {
  value = module.this.ops_app_name
}

output "ops_default_hostname" {
  value = module.this.ops_default_hostname
}

output "ops_url" {
  value = module.this.ops_url
}

output "ops_principal_id" {
  value = module.this.ops_principal_id
}

output "api_app_name" {
  value = module.this.api_app_name
}

output "api_default_hostname" {
  value = module.this.api_default_hostname
}

output "api_url" {
  value = module.this.api_url
}

output "api_principal_id" {
  value = module.this.api_principal_id
}

output "better_auth_secret" {
  description = "Generated Better Auth signing secret (separate value from prod)."
  value       = module.this.better_auth_secret
  sensitive   = true
}
