# Branch rulesets: require pull requests, block force-push and branch deletion.
# We do not set required_status_checks in Terraform — GitHub matches checks by
# context strings that drift (workflow renames, “ (pull_request)” suffix, etc.).
# Use the GitHub UI on branch / ruleset settings if you want merge-blocking
# checks and pick names from the dropdown after CI has run at least once.
resource "github_repository_ruleset" "main" {
  name        = "protect-main"
  repository  = var.github_repo
  enforcement = "active"
  target      = "branch"

  conditions {
    ref_name {
      include = ["refs/heads/main"]
      exclude = []
    }
  }

  rules {
    deletion         = true
    non_fast_forward = true

    pull_request {
      required_approving_review_count = 0
    }
  }
}

resource "github_repository_ruleset" "staging" {
  name        = "protect-staging"
  repository  = var.github_repo
  enforcement = "active"
  target      = "branch"

  conditions {
    ref_name {
      include = ["refs/heads/staging"]
      exclude = []
    }
  }

  rules {
    deletion         = true
    non_fast_forward = true

    pull_request {
      required_approving_review_count = 0
    }
  }
}
