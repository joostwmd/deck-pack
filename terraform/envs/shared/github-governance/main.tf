module "repo_rules" {
  source = "../../../modules/github-repo-rules"

  github_repo = var.github_repo
}
