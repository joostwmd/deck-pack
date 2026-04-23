import { createOpsAuth, type AuthDb } from "./index";

/**
 * Config for `@better-auth/cli generate`. Uses `createOpsAuth` (superset of
 * plugins: admin + org) so the generated schema matches all server instances.
 * No queries are ever executed, so a fake DB is fine.
 *
 * This file is safe to import without any env set. It must remain that way —
 * do not import `@deck-pack/env`, `@deck-pack/db`, or `@deck-pack/email` here.
 */
export const auth = createOpsAuth({
  db: {} as AuthDb,
  secret: "schema-generation-only",
  baseURL: "http://localhost",
  trustedOrigins: ["http://localhost"],
  sendOtp: async () => {
    /* no-op for schema generation */
  },
});
