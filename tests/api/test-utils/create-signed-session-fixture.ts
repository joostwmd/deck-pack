/**
 * Thin re-exports so existing transport imports keep working.
 * Prefer importing from `tests/support/*` in new code.
 */
export {
  attachSessionWorkspace,
  cleanupSignedSession,
  seedSignedSession,
  type SeedSessionInput,
  type SignedSessionFixture,
} from "../../support/seed-session";

import { seedSignedSession } from "../../support/seed-session";

/** @deprecated Prefer `seedSignedSession` from tests/support/seed-session. */
export async function createSignedSessionFixture(args: {
  cookieName?: string;
  emailPrefix: string;
}): Promise<import("../../support/seed-session").SignedSessionFixture> {
  return seedSignedSession({
    cookieName: args.cookieName,
    emailPrefix: args.emailPrefix,
  });
}
