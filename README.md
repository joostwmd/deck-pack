# 📦 DeckPack

DeckPack is a PowerPoint add-in and supporting web apps for managing presentation assets — slides, icons, logos, photos, and related content — from inside PowerPoint and a web portal.

This monorepo contains:

- 🧩 **Assets add-in** (`apps/addins/assets`) — Office taskpane that runs inside PowerPoint
- 🏢 **Portal** (`apps/portal`) — organization admin dashboard for libraries, members, and billing
- 🛠️ **Ops** (`apps/ops`) — internal operations dashboard
- ⚡ **API** (`apps/api`) — shared Hono + tRPC backend with Better Auth, Drizzle, and PostgreSQL

Frontends deploy to Azure Static Web Apps. The API runs as a Linux container on Azure App Service.

---

## 🚀 Deployments

| Application | Role                          | Production                                                                                                           | Staging                                                                                                                |
| ----------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Ops**     | Internal operations dashboard | [https://black-smoke-07a6dfd03.7.azurestaticapps.net/](https://black-smoke-07a6dfd03.7.azurestaticapps.net/)         | [https://icy-bush-019ec7e03.7.azurestaticapps.net/](https://icy-bush-019ec7e03.7.azurestaticapps.net/)                 |
| **Portal**  | Organization admin dashboard  | [https://green-ocean-0ddb52203.7.azurestaticapps.net/](https://green-ocean-0ddb52203.7.azurestaticapps.net/)         | [https://gentle-river-0e962ad03.7.azurestaticapps.net/](https://gentle-river-0e962ad03.7.azurestaticapps.net/)         |
| **Add-in**  | DeckPack add-in web shell     | [https://wonderful-field-03fcf7803.7.azurestaticapps.net/](https://wonderful-field-03fcf7803.7.azurestaticapps.net/) | [https://delightful-stone-022ae5503.7.azurestaticapps.net/](https://delightful-stone-022ae5503.7.azurestaticapps.net/) |
| **API**     | Hono + tRPC + Better Auth     | [https://deck-pack-api-dpc.azurewebsites.net/](https://deck-pack-api-dpc.azurewebsites.net/)                         | [https://deck-pack-api-staging-dpc.azurewebsites.net/](https://deck-pack-api-staging-dpc.azurewebsites.net/)           |

---

## 🔌 Sideloading the PowerPoint add-in

Manifests live in `apps/addins/assets/manifests/`. Each environment points the taskpane at a different host:

| Version           | Manifest               | Taskpane source           | Command                        |
| ----------------- | ---------------------- | ------------------------- | ------------------------------ |
| 🧪 **Dev**        | `manifest.dev.xml`     | `https://localhost:3003`  | `pnpm sideload:assets`         |
| 🚧 **Staging**    | `manifest.staging.xml` | staging Static Web App    | `pnpm sideload:assets:staging` |
| ✅ **Production** | `manifest.prod.xml`    | production Static Web App | `pnpm sideload:assets:prod`    |

### 💻 Local development

Run the Vite add-in server and sideload the dev manifest (two terminals):

```bash
pnpm dev:assets        # HTTPS server at https://localhost:3003
pnpm sideload:assets   # register manifest.dev.xml and launch PowerPoint
```

First-time HTTPS certs are installed automatically on `pnpm dev:assets`. Manual fallback:

```bash
npx office-addin-dev-certs install
```

### ☁️ Staging or production

No local Vite server needed — the manifest loads the deployed Static Web App:

```bash
pnpm sideload:assets:staging
pnpm sideload:assets:prod
```

### 🧰 Useful extras

```bash
pnpm -F @deck-pack/assets sideload:stop      # stop the dev sideload
pnpm -F @deck-pack/assets validate           # validate dev manifest
pnpm -F @deck-pack/assets validate:staging
pnpm -F @deck-pack/assets validate:prod
```

If PowerPoint keeps showing a stale build, clear the Office wef cache:

- 🍎 **macOS:** `~/Library/Containers/com.microsoft.Powerpoint/Data/Documents/wef`
- 🪟 **Windows:** `%LOCALAPPDATA%\Microsoft\Office\16.0\Wef\`

---

## 🧭 Local setup

### ✅ Prerequisites

- Node.js 20+ (22 recommended)
- pnpm 10
- Docker (local Postgres via `packages/db/docker-compose.yml`)

### 📥 Install and env files

```bash
pnpm install
cp .env.example apps/api/.env
cp apps/ops/.env.example apps/ops/.env
# Also copy .env examples for portal / add-in if you run those apps locally
```

For OTP sign-in, set `EMAIL_API_KEY` and `EMAIL_FROM` in `apps/api/.env`.

Set API CORS / trusted origins to your local frontend ports, for example:

```env
CORS_ORIGINS=http://localhost:3001,http://localhost:3002,https://localhost:3003
```

### 🗄️ Database

```bash
pnpm db:start
pnpm db:push
```

### 🖥️ Dev servers

```bash
pnpm dev:api      # API — http://localhost:3000
pnpm dev:ops      # Ops — http://localhost:3001
pnpm dev:portal   # Portal — http://localhost:3002
pnpm dev:assets   # Add-in — https://localhost:3003
```

### 🧪 Tests

```bash
pnpm test:unit
pnpm test:integration          # needs Postgres running
pnpm test:integration:with-db  # starts Postgres, then runs integration tests
pnpm test:e2e                  # Playwright
```
