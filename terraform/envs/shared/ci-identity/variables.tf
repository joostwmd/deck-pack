variable "subscription_id" {
  description = "Azure subscription ID used for role assignments and outputs."
  type        = string
}

variable "tenant_id" {
  description = "Microsoft Entra tenant ID where the CI app registration is created."
  type        = string
}

variable "acr_id" {
  description = "Resource ID of the Azure Container Registry receiving image pushes."
  type        = string
}

variable "acr_name" {
  description = "Container registry name (for GitHub repo variable ACR_NAME)."
  type        = string
}

variable "acr_login_server" {
  description = "Container registry login server (for GitHub repo variable ACR_LOGIN_SERVER)."
  type        = string
}

variable "github_owner" {
  description = "GitHub organization/user owning the repository."
  type        = string
}

variable "github_repo" {
  description = "GitHub repository name."
  type        = string
}

variable "github_branch" {
  description = "Branch allowed to request OIDC tokens."
  type        = string
  default     = "main"
}

variable "github_environments" {
  description = "GitHub Actions environments that can claim this identity via OIDC (one federated credential per entry)."
  type        = list(string)
  default     = []
}

variable "identity_name" {
  description = "Display name for the CI app/service principal."
  type        = string
  default     = "deck-pack-github-ci"
}
