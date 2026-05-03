# CI/CD and branching (hand-in evidence)

Supporting the Cloud Computing module checklist: pipelines, branching, IaC paths, and secrets/OIDC pointers.

**Human-readable workflow map:** [`.github/workflows/README.md`](../.github/workflows/README.md)

See also `assesment/cloud-computing/module.md` in your local tree (that folder may be gitignored).

## Branch protection (Terraform) — no required check strings

**Terraform** (`terraform/envs/shared/github-governance/`) configures **repository rulesets** for **`main`** and **`staging`**:

- Merges go through a **pull request**; **force-push** and **branch deletion** are blocked.

We **do not** declare **`required_status_checks`** in Terraform. GitHub’s check **context** strings are easy to mismatch (renames, event suffixes), which produces **“Expected — Waiting for status”** even when jobs are green.

**CI** on **`staging`**: [`.github/workflows/pull-request-ci.yml`](../.github/workflows/pull-request-ci.yml) invokes the reusable **`test-suite.yml`** plus build, oxlint, typecheck, Docker build. To **block** merges until those pass, configure **required status checks** in the **GitHub UI** for **`staging`** and pick the contexts after a green run — no magic strings in this repo.

**Promotion policy:** only **`staging`** may open a PR into **`main`** — [`.github/workflows/pull-request-main-branch-rules.yml`](../.github/workflows/pull-request-main-branch-rules.yml). PRs into **`main`** do **not** run **`pull-request-ci`** (staging push already ran tests + deploy gate).

After changing Terraform rules, run `pnpm tf:apply:shared:github-governance`.

---

## Branch model

```mermaid
flowchart LR
  feature[feature_branch]
  staging[staging]
  main[main]
  feature -->|PR_CI_tests_plus_build| staging
  staging -->|promotion_PR_rules_only| main
  main -->|manual_prod_workflow| prod[Prod_API_and_SWA]
```

- Feature work branches from **`staging`**; pull requests target **`staging`**. **`pull-request-ci.yml`** runs **`test-suite.yml`** (Vitest unit + Postgres integration) plus build and lint gates; **no** shared staging deploy until merge.
- Merges to **`staging`** trigger **`staging-deploy.yml`**: **`test-suite`** → parallel **build phase** → parallel **deploy phase** (API restart + staging SWAs).
- PRs to **`main`**: **`pull-request-main-branch-rules.yml`** only (head must be **`staging`**).

## IaC and GitHub rules

| Area                                                             | Path                                                                                  |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| GitHub rulesets (PR required, no force-push, no branch deletion) | `terraform/envs/shared/github-governance/` and `terraform/modules/github-repo-rules/` |
| Entra OIDC for Actions → Azure                                   | `terraform/modules/ci-identity/main.tf`                                               |

Apply with a repo-admin PAT (`TF_VAR_github_token` or `terraform.tfvars`); see `terraform/envs/shared/github-governance/terraform.tfvars.example`.

## Workflow files

| File                                 | Role                                                                                                                           |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `test-suite.yml`                     | **`workflow_call`**: unit tests + Postgres integration tests (used by **`pull-request-ci.yml`** and **`staging-deploy.yml`**). |
| `pull-request-ci.yml`                | PRs targeting **`staging`**: test suite + build + oxlint + typecheck + Docker build API (no push).                             |
| `pull-request-main-branch-rules.yml` | PRs → **`main`**: fail unless head branch is **`staging`** (no rerun of **`pull-request-ci`**).                                |
| `staging-deploy.yml`                 | **Push `staging`**: test gate, then staged **build-all / deploy-together** (API image + staging SWAs).                         |
| `production-deploy.yml`              | **Manual**: same two-phase rollout for prod API + Static Web Apps.                                                             |

### Local testing

After `pnpm install`, run **`pnpm test:unit`** (no database). **`pnpm test:integration`** expects **`DATABASE_URL`** and a reachable Postgres matching **`@deck-pack/env/server`** (CI applies schema via **`pnpm --filter @deck-pack/db exec drizzle-kit push`** first).

## Release process (short)

1. PR **feature → `staging`**; merge when satisfied with **`pull-request-ci`** (includes tests).
2. **`staging`** push runs **`staging-deploy.yml`** (tests again, coordinated API + SWAs).
3. PR **`staging` → `main`** when ready (**staging-head rule** only — no **`pull-request-ci`** on `main`).
4. Merge **`main`**; run **Production — full release** when you want production updated.

## IAM and secrets

- **Azure**: OIDC via `azure/login` and GitHub Environments **`staging`** / **`prod`** (see `ci-identity`).
- Do not commit application secrets or PATs; keep `terraform.tfvars` gitignored.
