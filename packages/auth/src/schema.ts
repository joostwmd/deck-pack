import { createAuth, type AuthDb } from "./index";

/**
 * Config for `@better-auth/cli generate`. Reuses the real `createAuth` so
 * plugins stay in sync — the CLI introspects plugins to derive the Drizzle
 * schema. No queries are ever executed, so a fake DB is fine.
 *
 * This file is safe to import without any env set. It must remain that way —
 * do not import `@deck-pack/env`, `@deck-pack/db`, or `@deck-pack/email` here.
 */
export const auth = createAuth({
  db: {} as AuthDb,
  secret: "schema-generation-only",
  baseURL: "http://localhost",
  trustedOrigins: ["http://localhost"],
  sendOtp: async () => {
    /* no-op for schema generation */
  },
});
