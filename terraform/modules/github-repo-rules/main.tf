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

    dynamic "required_status_checks" {
      for_each = length(var.required_ci_contexts_main) > 0 ? [1] : []
      content {
        strict_required_status_checks_policy = true

        dynamic "required_check" {
          for_each = var.required_ci_contexts_main
          content {
            context        = required_check.value
            integration_id = 15368
          }
        }
      }
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

    dynamic "required_status_checks" {
      for_each = length(var.required_ci_contexts_staging) > 0 ? [1] : []
      content {
        strict_required_status_checks_policy = true

        dynamic "required_check" {
          for_each = var.required_ci_contexts_staging
          content {
            context        = required_check.value
            integration_id = 15368
          }
        }
      }
    }
  }
}
