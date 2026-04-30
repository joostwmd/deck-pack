variable "github_owner" {
  description = "GitHub organization or user that owns the repository."
  type        = string
}

variable "github_repo" {
  description = "Repository name (short name only)."
  type        = string
}

variable "github_token" {
  description = "PAT with admin permissions on the repo. Never commit this value."
  type        = string
  sensitive   = true
}
