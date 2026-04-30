# Workflows in this repo — quick map

All names follow **environment — what deploys — how**.

| File                                     | When it runs                          | What it does                                                                                                                                                                                                                                                                                |
| ---------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`pull-request-ci.yml`**                | Pull request → `staging` or `main`    | **No deploy.** Lint, typecheck, monorepo build, validate API Dockerfile (no push).                                                                                                                                                                                                          |
| **`pull-request-main-branch-rules.yml`** | Pull request → `main` only            | **No deploy.** Fails the PR if the source branch is not **`staging`** (so `main` only receives promoted code from your integration branch).                                                                                                                                                 |
| **`staging-api-container.yml`**          | Push to **`staging`** (or manual)     | **Staging backend:** build API Docker image → push to ACR (`:staging` + SHA) → restart **staging** App Service.                                                                                                                                                                             |
| **`staging-frontend-swa.yml`**           | Push to **`staging`** (or manual)     | **Staging frontends:** build ops / portal / add-in assets → upload to **staging** Azure Static Web Apps.                                                                                                                                                                                    |
| **`production-deploy.yml`**              | **Manual** (`workflow_dispatch`) only | **Production — everything in one run:** API image `:latest` + SHA to ACR → restart **prod** App Service (`environment: prod`), **and** build + upload all **prod** Static Web Apps in parallel. Run from the branch/commit you want live (usually `main` after merging `staging` → `main`). |

### Mental model

1. **Feature → `staging`:** CI on the PR; merge updates **staging** API + staging SWA (two workflows on push to `staging`).
2. **`staging` → `main`:** CI + main-branch rules; merge moves **`main`** forward (no automatic prod deploy).
3. **Production:** run **Actions → “Production — full release (API + frontends)”** once — same commit gets API + all prod frontends.

`main` is your **record of what is promoted**; **production Azure** updates when you run the manual release workflow so API and sites stay in sync.
