# syntax=docker/dockerfile:1
# Build from repo root:
#   docker build -f docker/api.Dockerfile -t deck-pack-api .
#
# Run (set env for your database / auth — see apps/api/.env.example):
#   docker run --rm -p 3000:3000 -e DATABASE_URL=... -e BETTER_AUTH_SECRET=... \
#     -e BETTER_AUTH_URL=http://localhost:3000 -e CORS_ORIGIN=http://localhost:8080 \
#     deck-pack-api

FROM node:22-bookworm-slim AS builder
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps ./apps
COPY packages ./packages

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @deck-pack/api build
RUN pnpm --filter @deck-pack/api deploy --prod --legacy /prod/api \
  && cp -r /app/apps/api/dist /prod/api/dist

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update \
  && apt-get install -y --no-install-recommends tini \
  && rm -rf /var/lib/apt/lists/*

COPY --from=builder /prod/api ./

RUN chown -R node:node /app
USER node

EXPOSE 3000
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "dist/index.mjs"]
