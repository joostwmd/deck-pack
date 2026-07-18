import { auth } from "@deck-pack/auth/server";
import { getSessionCookieName } from "@deck-pack/auth/session-cookie";
import { createDb } from "@deck-pack/db";
import { session, user } from "@deck-pack/db/schema/auth";
import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";

import { createSignedSessionFixture } from "../test-utils/create-signed-session-fixture";
import { createApp } from "@deck-pack/api/server";

describe("bearer session transport", () => {
  const db = createDb();
  const createdUserIds: string[] = [];
  const cookieName = getSessionCookieName(process.env.BETTER_AUTH_URL ?? "http://localhost");

  afterAll(async () => {
    for (const userId of createdUserIds) {
      await db.delete(session).where(eq(session.userId, userId));
      await db.delete(user).where(eq(user.id, userId));
    }
  });

  it("resolves auth sessions from cookies and Authorization bearer tokens", async () => {
    const fixture = await createSignedSessionFixture({
      cookieName,
      emailPrefix: "bearer",
    });
    createdUserIds.push(fixture.userId);

    const cookieSession = await auth.api.getSession({
      headers: new Headers({
        Cookie: fixture.cookieHeader,
      }),
    });

    expect(cookieSession?.user.email).toBe(fixture.email);

    const app = createApp();
    const bearerResponse = await app.request("/api/auth/get-session", {
      headers: {
        Authorization: `Bearer ${fixture.bearerToken}`,
      },
    });

    expect(bearerResponse.status).toBe(200);
    const bearerBody = (await bearerResponse.json()) as { user?: { email?: string } } | null;
    expect(bearerBody?.user?.email).toBe(fixture.email);
  });

  it("reaches a protected tRPC procedure with bearer auth", async () => {
    const fixture = await createSignedSessionFixture({
      cookieName,
      emailPrefix: "trpc-bearer",
    });
    createdUserIds.push(fixture.userId);

    const app = createApp();
    const response = await app.request("/trpc/privateData", {
      headers: {
        Authorization: `Bearer ${fixture.bearerToken}`,
      },
    });

    expect(response.status, await response.clone().text()).toBe(200);
    const body = (await response.json()) as {
      result?: {
        data?: {
          json?: { message?: string; user?: { id?: string; email?: string } };
        };
      };
    };

    expect(body.result?.data?.json?.message).toBe("This is private");
    expect(body.result?.data?.json?.user?.email).toBe(fixture.email);
  });

  it("resolves cookie sessions through the unified auth handler", async () => {
    const fixture = await createSignedSessionFixture({
      cookieName,
      emailPrefix: "cookie-session",
    });
    createdUserIds.push(fixture.userId);

    const cookieSession = await auth.api.getSession({
      headers: new Headers({
        Cookie: fixture.cookieHeader,
      }),
    });

    expect(cookieSession?.user.email).toBe(fixture.email);

    const app = createApp();
    const response = await app.request("/api/auth/get-session", {
      headers: {
        Cookie: fixture.cookieHeader,
      },
    });

    expect(response.status).toBe(200);
    const body = (await response.json()) as { user?: { email?: string } } | null;
    expect(body?.user?.email).toBe(fixture.email);
  });
});
