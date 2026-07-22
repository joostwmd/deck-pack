import type { BrowserContext, Page } from "@playwright/test";
import { expect } from "@playwright/test";

import { seedApiTestEnv } from "../../tests/api/test-utils/seed-api-test-env";
import {
  attachSessionWorkspace,
  seedSignedSession,
  type SignedSessionFixture,
} from "../../tests/support/seed-session";
import { seedPersonalOrganization, seedTeamOrganization } from "../../tests/support/seed-org";

seedApiTestEnv();

const API_ORIGIN = process.env.E2E_API_URL ?? "http://127.0.0.1:3000";

export async function injectSessionCookies(
  context: BrowserContext,
  session: SignedSessionFixture,
): Promise<void> {
  const { hostname } = new URL(API_ORIGIN);

  if (session.cookies.length > 0) {
    await context.addCookies(
      session.cookies.map((cookie) => ({
        name: cookie.name,
        value: cookie.value,
        domain: hostname,
        path: cookie.path || "/",
        httpOnly: cookie.httpOnly ?? true,
        secure: cookie.secure ?? false,
        sameSite: cookie.sameSite ?? "Lax",
      })),
    );
    return;
  }

  await context.addCookies([
    {
      name: "deckpack.session_token",
      value: session.bearerToken,
      domain: hostname,
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
}

/** @deprecated Prefer injectSessionCookies(context, session). */
export async function injectApiSessionCookie(
  context: BrowserContext,
  bearerToken: string,
): Promise<void> {
  const { hostname } = new URL(API_ORIGIN);
  await context.addCookies([
    {
      name: "deckpack.session_token",
      value: bearerToken,
      domain: hostname,
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
}

export async function seedOpsAdminSession() {
  return seedSignedSession({
    email: `e2e-admin-${crypto.randomUUID()}@code.berlin`,
    name: "E2E Admin",
    role: "admin",
  });
}

export async function seedPortalSoloSession() {
  const session = await seedSignedSession({
    emailPrefix: "e2e-portal-solo",
    name: "E2E Portal Solo",
  });
  const { organizationId } = await seedPersonalOrganization({
    userId: session.userId,
    email: session.email,
    name: session.email,
  });
  await attachSessionWorkspace({
    userId: session.userId,
    organizationId,
    workspace: "solo",
  });
  return { ...session, organizationId };
}

export async function seedPortalTeamSession() {
  const session = await seedSignedSession({
    emailPrefix: "e2e-portal-team",
    name: "E2E Portal Team",
  });
  const org = await seedTeamOrganization({
    ownerUserId: session.userId,
    name: "E2E Team Org",
  });
  await attachSessionWorkspace({
    userId: session.userId,
    organizationId: org.organizationId,
    workspace: "team",
  });
  return { ...session, organizationId: org.organizationId, org };
}

/**
 * Assert a protected page rendered without the global error boundary / OTP wall.
 * Optionally assert a page heading when the view has a stable h1.
 */
export async function assertPageRendered(
  page: Page,
  opts: { heading?: string | RegExp; url?: RegExp } = {},
): Promise<void> {
  await expect(page.getByRole("heading", { name: "Something went wrong" })).toHaveCount(0);
  await expect(page.getByRole("textbox", { name: /email/i })).toHaveCount(0);
  if (opts.url) {
    await expect(page).toHaveURL(opts.url, { timeout: 30_000 });
  }
  if (opts.heading) {
    await expect(page.getByRole("heading", { name: opts.heading }).first()).toBeVisible({
      timeout: 30_000,
    });
  } else {
    await expect(page.locator("#app")).toBeVisible({ timeout: 30_000 });
  }
}
