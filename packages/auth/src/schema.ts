import { createAuth, type AuthDb } from "./index";

/**
 * Config for `@better-auth/cli generate`. Uses `createAuth` (superset of
 * plugins: admin + org + bearer) so the generated schema matches the server.
 * No queries are ever executed, so a fake DB is fine.
 *
 * This file is safe to import without any env set. It must remain that way —
 * do not import `@deck-pack/env`, `@deck-pack/db`, or Resend/email helpers here.
 */
export const auth = createAuth({
  db: {} as AuthDb,
  secret: "schema-generation-only",
  baseURL: "http://localhost",
  trustedOrigins: ["http://localhost"],
  adminEmailDomain: "code.berlin",
  opsOrigins: ["http://localhost:3001"],
  sendOtp: async () => {
    /* no-op for schema generation */
  },
});
