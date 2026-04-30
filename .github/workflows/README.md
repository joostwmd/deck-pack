# Workflows in this repo — quick map

All names follow **environment — what deploys — how**.

| File                                     | When it runs                          | What it does                                                                                                                                                                                                                                                                                |
| ---------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`pull-request-ci.yml`**                | Pull request → `staging` or `main`    | **No deploy.** Lint, typecheck, monorepo build, validate API Dockerfile (no push).                                                                                                                                                                                                          |
| **`pull-request-main-branch-rules.yml`** | Pull request → `main` only            | **No deploy.** Fails the PR if the source branch is not **`staging`** (so `main` only receives promoted code from your integration branch).                                                                                                                                                 |
| **`staging-deploy.yml`**                 | Push to **`staging`** (or manual)     | **Staging — full stack:** API Docker image → ACR (`:staging` + SHA) → restart **staging** App Service, **and** build + upload ops, portal, and add-in assets to **staging** Static Web Apps (parallel jobs; same shape as production).                                                      |
| **`production-deploy.yml`**              | **Manual** (`workflow_dispatch`) only | **Production — everything in one run:** API image `:latest` + SHA to ACR → restart **prod** App Service (`environment: prod`), **and** build + upload all **prod** Static Web Apps in parallel. Run from the branch/commit you want live (usually `main` after merging `staging` → `main`). |

### Mental model

1. **Feature → `staging`:** CI on the PR; merge runs **`staging-deploy.yml`** (API + all staging SWAs in one workflow).
2. **`staging` → `main`:** CI + main-branch rules; merge moves **`main`** forward (no automatic prod deploy).
3. **Production:** run **Actions → “Production — full release (API + frontends)”** once — same commit gets API + all prod frontends.

`main` is your **record of what is promoted**; **production Azure** updates when you run the manual release workflow so API and sites stay in sync.
