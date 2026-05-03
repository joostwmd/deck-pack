# Workflows in this repo — quick map

All names follow **environment — what deploys — how**.

| File                                     | When it runs                          | What it does                                                                                                                                                                                                                                     |
| ---------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **`test-suite.yml`**                     | **`workflow_call` only** (reusable)   | Unit tests + Postgres-backed integration tests (`pg_isready` health gate, `drizzle-kit push`, Vitest integration project). Used by **`pull-request-ci.yml`** and **`staging-deploy.yml`**.                                                       |
| **`pull-request-ci.yml`**                | Pull request → **`staging` only**     | **No deploy.** Reusable test suite (`test-suite.yml`), then lint, typecheck, monorepo build, validate API Dockerfile (no push). **Does not run** on PRs **`staging` → `main`** (heavy CI intentionally skipped after staging already validated). |
| **`pull-request-main-branch-rules.yml`** | Pull request → `main` only            | **No deploy.** Fails the PR if the source branch is not **`staging`** (so `main` only receives promoted code from your integration branch).                                                                                                      |
| **`staging-deploy.yml`**                 | Push to **`staging`** (or manual)     | **`test-suite`** first, then **phase 1** in parallel (API Docker **push**, three SWAs **build** → artifacts), then **phase 2** in parallel (API restart + three SWA **uploads**) so staging frontends and backend go live together.              |
| **`production-deploy.yml`**              | **Manual** (`workflow_dispatch`) only | Same **two-phase** pattern as staging (**no test gate** unless you add one): parallel builds → parallel API restart + prod SWA uploads. Run from the branch/commit you want live (usually **`main`**).                                           |

### Mental model

1. **Feature → `staging`:** Full CI including tests on the PR; merge runs **`staging-deploy.yml`** (tests again, then coordinated API + staging SWAs).
2. **`staging` → `main`:** **`pull-request-main-branch-rules`** only (head must be `staging`); no **`pull-request-ci`** rerun on that promotion PR.
3. **Production:** run **Actions → “Production — full release (API + frontends)”** once — coordinated build-all-then-deploy for API + prod frontends.

`main` is your **record of what is promoted**; **production Azure** updates when you run the manual release workflow so API and sites stay in sync.
