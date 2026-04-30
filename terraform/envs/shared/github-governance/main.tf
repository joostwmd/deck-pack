module "repo_rules" {
  source = "../../../modules/github-repo-rules"

  github_repo                  = var.github_repo
  required_ci_contexts_staging = var.required_ci_contexts_staging
  required_ci_contexts_main    = var.required_ci_contexts_main
}
