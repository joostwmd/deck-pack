# Branch rulesets: require pull requests, block force-push and branch deletion.
# Staging also requires one aggregate Actions check (see pull-request-ci.yml
# `Staging merge gate`) so lint, build, typecheck, and Docker build must pass.
# Context must match GitHub exactly — if merges stall on “Expected”, compare the
# check name in the PR Checks tab with `required_check.context` below.

# GitHub Actions app / integration id used for status checks from workflows.
# See: https://api.github.com/apps/github-actions
locals {
  github_actions_integration_id = 15368
}

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

    required_status_checks {
      strict_required_status_checks_policy = true

      required_check {
        context        = "Pull request — quality checks / Staging merge gate"
        integration_id = local.github_actions_integration_id
      }
    }
  }
}
