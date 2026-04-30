# CI/CD and branching (hand-in evidence)

Supporting the Cloud Computing module checklist: pipelines, branching, IaC paths, and secrets/OIDC pointers.

**Human-readable workflow map:** [`.github/workflows/README.md`](../.github/workflows/README.md)

See also `assesment/cloud-computing/module.md` in your local tree (that folder may be gitignored).

## Staging merge gates (Terraform + CI)

**Terraform** (`terraform/envs/shared/github-governance/`) configures **repository rulesets** for `main` and `staging`:

- **Both:** merges go through a **pull request**; **force-push** and **branch deletion** are blocked.
- **`staging` only:** **`required_status_checks`** with **`strict_required_status_checks_policy = true`** so the PR must be **up to date with `staging`** and must pass **`Staging merge gate`**. “Up to date” is **not** a separate row in Checks: when you’re behind, GitHub shows **This branch is out of date with the base branch** and **Update branch** near the merge area; when you’re current, nothing extra appears.

The **Staging merge gate** job in [`.github/workflows/pull-request-ci.yml`](../.github/workflows/pull-request-ci.yml) runs only after **Lint and build** (`pnpm build`, `pnpm oxlint:strict`, `pnpm check-types`) and **Docker build (API)** succeed — one stable check name for the ruleset instead of three separate Terraform strings.

If GitHub shows **Expected — Waiting for status** while the job is green, the ruleset **context** is usually missing the Actions suffix **` (pull_request)`** — compare the gray “Expected” row vs the green row on the PR **Checks** tab.

**`main`** still has no Terraform-managed required checks (promotion PRs use the same workflow for visibility). **Promotion policy:** only **`staging`** may open a PR into **`main`** — [`.github/workflows/pull-request-main-branch-rules.yml`](../.github/workflows/pull-request-main-branch-rules.yml).

After changing rules, run `pnpm tf:apply:shared:github-governance`.

---

## Branch model

```mermaid
flowchart LR
  feature[feature_branch]
  staging[staging]
  main[main]
  feature -->|PR_CI| staging
  staging -->|PR_CI_plus_staging_only_to_main| main
  main -->|manual_prod_workflow| prod[Prod_API_and_SWA]
```

- Feature work branches from **`staging`**; pull requests target **`staging`**. CI runs on the PR; **no** shared staging deploy runs from feature branches until merge.
- Merges to **`staging`** trigger **staging** deploys (API container + staging SWA).
- PRs to **`main`**: CI + **`pull-request-main-branch-rules.yml`** (head must be **`staging`**).

## IaC and GitHub rules

| Area                                                             | Path                                                                                  |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| GitHub rulesets (PR required, no force-push, no branch deletion) | `terraform/envs/shared/github-governance/` and `terraform/modules/github-repo-rules/` |
| Entra OIDC for Actions → Azure                                   | `terraform/modules/ci-identity/main.tf`                                               |

Apply with a repo-admin PAT (`TF_VAR_github_token` or `terraform.tfvars`); see `terraform/envs/shared/github-governance/terraform.tfvars.example`.

## Workflow files

| File                                 | Role                                                                           |
| ------------------------------------ | ------------------------------------------------------------------------------ |
| `pull-request-ci.yml`                | PRs → `staging` / `main`: build, oxlint, typecheck, Docker build API (no push) |
| `pull-request-main-branch-rules.yml` | PRs → `main`: fail unless head branch is `staging`                             |
| `staging-api-container.yml`          | **Push `staging`**: ACR `:staging` + SHA, restart staging App Service          |
| `staging-frontend-swa.yml`           | **Push `staging`**: staging Static Web Apps                                    |
| `production-deploy.yml`              | **Manual**: prod API + prod Static Web Apps                                    |

## Release process (short)

1. PR **feature → `staging`**; merge when satisfied with CI.
2. **`staging`** push deploys staging API + SWA.
3. PR **`staging` → `main`** when ready; CI + staging-head rule must pass.
4. Merge **`main`**; run **Production — full release** when you want production updated.

## IAM and secrets

- **Azure**: OIDC via `azure/login` and GitHub Environments **`staging`** / **`prod`** (see `ci-identity`).
- Do not commit application secrets or PATs; keep `terraform.tfvars` gitignored.
