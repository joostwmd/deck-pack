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

variable "required_ci_contexts_staging" {
  description = "Optional required check contexts for merges into staging."
  type        = list(string)
  default     = []
}

variable "required_ci_contexts_main" {
  description = "Optional required check contexts for merges into main."
  type        = list(string)
  default     = []
}
