/**
 * Vitest globalSetup for the `integration` project.
 * Seeds env vars before workers load tests that hit Postgres or the API.
 *
 * Default DATABASE_URL matches `packages/db/docker-compose.yml`.
 * Start DB: `pnpm db:start` or use `pnpm test:integration:with-db`.
 */
export default function seedIntegrationTestEnv(): void {
  process.env.DATABASE_URL ??= "postgresql://postgres:password@127.0.0.1:5432/deck-pack";
  process.env.BETTER_AUTH_SECRET ??= "test-integration-secret-placeholder-32-characters-min";
  process.env.BETTER_AUTH_URL ??= "http://127.0.0.1:3000";
  process.env.CORS_ORIGINS ??= "http://127.0.0.1:5173";
  process.env.EMAIL_API_KEY ??= "test-integration-key";
  process.env.EMAIL_FROM ??= "integration@test.local";
  process.env.PEXELS_API_KEY ??= "test-integration-pexels-key";
  process.env.NODE_ENV ??= "test";
}
