# syntax=docker/dockerfile:1
# Build from repo root (set public API URL used by the browser):
#   docker build -f docker/ops.Dockerfile \
#     --build-arg VITE_SERVER_URL=https://api.example.com \
#     -t deck-pack-ops .
#
# Run:
#   docker run --rm -p 8080:8080 deck-pack-ops

FROM node:22-bookworm-slim AS builder
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps ./apps
COPY packages ./packages

RUN pnpm install --frozen-lockfile

ARG VITE_SERVER_URL=http://localhost:3000
ENV VITE_SERVER_URL=${VITE_SERVER_URL}

RUN pnpm --filter @deck-pack/ops build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN npm install --global serve@14.2.4

COPY --from=builder /app/apps/ops/dist ./dist

EXPOSE 8080
CMD ["serve", "-s", "dist", "-l", "8080"]
