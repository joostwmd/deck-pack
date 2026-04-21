variable "acr_id" {
  description = "Resource ID of the Azure Container Registry receiving image pushes."
  type        = string
}

variable "github_owner" {
  description = "GitHub organization/user owning the repository (for OIDC subject)."
  type        = string
}

variable "github_repo" {
  description = "GitHub repository name (for OIDC subject)."
  type        = string
}

variable "github_branch" {
  description = "Branch allowed to request OIDC tokens (without refs/heads/ prefix)."
  type        = string
  default     = "main"
}

variable "github_environments" {
  description = "GitHub Actions environments that can claim this identity via OIDC. Empty list = no env-scoped credentials."
  type        = list(string)
  default     = []
}

variable "identity_name" {
  description = "Display name for the CI app/service principal."
  type        = string
  default     = "deck-pack-github-ci"
}

variable "webapp_scopes" {
  description = "Resource group IDs (or specific site IDs) where CI may restart Linux Web Apps. Grants 'Website Contributor' so the build workflow can run az webapp restart."
  type        = list(string)
  default     = []
}
