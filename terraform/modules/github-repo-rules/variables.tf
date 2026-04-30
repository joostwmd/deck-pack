variable "github_repo" {
  description = "GitHub repository name (without org)."
  type        = string
}

variable "required_ci_contexts_staging" {
  description = "Status check contexts required before merging into staging (GitHub Actions integration_id 15368). Leave empty until CI has run; then set exact names from the PR checks UI."
  type        = list(string)
  default     = []
}

variable "required_ci_contexts_main" {
  description = "Status check contexts required before merging into main. Include CI jobs plus promotion guard when enabled."
  type        = list(string)
  default     = []
}
