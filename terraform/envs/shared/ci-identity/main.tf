module "this" {
  source = "../../../modules/ci-identity"

  acr_id              = var.acr_id
  github_owner        = var.github_owner
  github_repo         = var.github_repo
  github_branch       = var.github_branch
  github_environments = var.github_environments
  identity_name       = var.identity_name
}
