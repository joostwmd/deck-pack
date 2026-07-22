import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getTestAuthHelpers } from "../../packages/auth/src/test-auth";
import { createDb } from "../../packages/db/src/client";
import { session, user } from "../../packages/db/src/schema/auth";

const supportDir = path.dirname(fileURLToPath(import.meta.url));
const requireFromDb = createRequire(path.join(supportDir, "../../packages/db/package.json"));
const { eq } = requireFromDb("drizzle-orm") as typeof import("drizzle-orm");

export type SignedSessionFixture = {
  userId: string;
  email: string;
  sessionToken: string;
  cookieHeader: string;
  /** Cookie value (signed), suitable for Authorization Bearer or Playwright addCookies. */
  bearerToken: string;
  /** Playwright-ready cookies from Better Auth testUtils (preferred for E2E). */
  cookies: Array<{
    name: string;
    value: string;
    domain: string;
    path: string;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: "Lax" | "Strict" | "None";
  }>;
};

export type SeedSessionInput = {
  emailPrefix?: string;
  email?: string;
  name?: string;
  role?: string | null;
  activeOrganizationId?: string | null;
  workspace?: "solo" | "team" | null;
};

/**
 * Creates a user (raw insert — skips BA user.create hooks / personal-org bootstrap)
 * then a real Better Auth session via `testUtils().login()` for cookie/bearer auth.
 *
 * Relative package imports keep Playwright (no Vitest aliases) working at repo root.
 */
export async function seedSignedSession(
  args: SeedSessionInput = {},
): Promise<SignedSessionFixture> {
  const db = createDb();
  const { test } = await getTestAuthHelpers();
  const userId = crypto.randomUUID();
  const email = args.email ?? `${args.emailPrefix ?? "session"}-${userId}@test.local`;
  const now = new Date();

  await db.insert(user).values({
    id: userId,
    name: args.name ?? "Session User",
    email,
    emailVerified: true,
    role: args.role ?? null,
    createdAt: now,
    updatedAt: now,
  });

  const login = await test.login({ userId });

  if (args.activeOrganizationId != null || args.workspace != null) {
    await attachSessionWorkspace({
      userId,
      organizationId: args.activeOrganizationId ?? undefined,
      workspace: args.workspace ?? undefined,
    });
  }

  const cookieHeader = login.headers.get("cookie") ?? "";
  const sessionCookie =
    login.cookies.find((c) => c.name.includes("session_token")) ?? login.cookies[0];
  const bearerToken = sessionCookie?.value ?? login.token;

  return {
    userId,
    email,
    sessionToken: login.token,
    cookieHeader,
    bearerToken,
    cookies: login.cookies,
  };
}

/** Updates an existing session's active org / workspace after org bootstrap. */
export async function attachSessionWorkspace(input: {
  userId: string;
  organizationId?: string;
  workspace?: "solo" | "team" | null;
}): Promise<void> {
  const db = createDb();
  const patch: {
    activeOrganizationId?: string | null;
    workspace?: "solo" | "team" | null;
  } = {};
  if (input.organizationId !== undefined) {
    patch.activeOrganizationId = input.organizationId;
  }
  if (input.workspace !== undefined) {
    patch.workspace = input.workspace;
  }
  if (Object.keys(patch).length === 0) return;

  await db.update(session).set(patch).where(eq(session.userId, input.userId));
}

/** Removes a seeded user (sessions first). */
export async function cleanupSignedSession(userId: string): Promise<void> {
  const db = createDb();
  await db
    .delete(session)
    .where(eq(session.userId, userId))
    .catch(() => undefined);
  await db
    .delete(user)
    .where(eq(user.id, userId))
    .catch(() => undefined);
}
