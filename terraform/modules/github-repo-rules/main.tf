# Branch rulesets: require pull requests, block force-push and branch deletion.
# We intentionally do NOT set required_status_checks here — GitHub matches checks
# by opaque/context strings that drift (e.g. " (pull_request)" suffix), which is
# brittle in Terraform. Teams rely on social review + green CI without merge gates.
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
