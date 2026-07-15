import { serializeSignedCookie } from "better-call";
import { createDb } from "@deck-pack/db";
import { session, user } from "@deck-pack/db/schema/auth";
import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";

import { appAuth, opsAuth } from "@deck-pack/auth/server";

import { createApp } from "../server";

type SignedSessionFixture = {
  userId: string;
  email: string;
  cookieHeader: string;
  bearerToken: string;
};

async function createSignedSessionFixture(args: {
  cookieName: string;
  emailPrefix: string;
}): Promise<SignedSessionFixture> {
  const db = createDb();
  const userId = crypto.randomUUID();
  const sessionId = crypto.randomUUID();
  const sessionToken = crypto.randomUUID();
  const email = `${args.emailPrefix}-${userId}@test.local`;

  await db.insert(user).values({
    id: userId,
    name: "Session User",
    email,
    emailVerified: true,
  });

  await db.insert(session).values({
    id: sessionId,
    userId,
    token: sessionToken,
    expiresAt: new Date(Date.now() + 86_400_000),
  });

  const cookieHeader = await serializeSignedCookie(
    args.cookieName,
    sessionToken,
    process.env.BETTER_AUTH_SECRET!,
  );
  const bearerToken = cookieHeader.split("=").slice(1).join("=");

  return { userId, email, cookieHeader, bearerToken };
}

describe("bearer session transport", () => {
  const db = createDb();
  const createdUserIds: string[] = [];

  afterAll(async () => {
    for (const userId of createdUserIds) {
      await db.delete(session).where(eq(session.userId, userId));
      await db.delete(user).where(eq(user.id, userId));
    }
  });

  it("resolves app auth sessions from cookies and Authorization bearer tokens", async () => {
    const fixture = await createSignedSessionFixture({
      cookieName: "app.session_token",
      emailPrefix: "bearer",
    });
    createdUserIds.push(fixture.userId);

    const cookieSession = await appAuth.api.getSession({
      headers: new Headers({
        Cookie: fixture.cookieHeader,
      }),
    });

    expect(cookieSession?.user.email).toBe(fixture.email);

    const app = createApp();
    const bearerResponse = await app.request("/api/auth/app/get-session", {
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
      cookieName: "app.session_token",
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

  it("still resolves ops cookie sessions without bearer transport", async () => {
    const fixture = await createSignedSessionFixture({
      cookieName: "ops.session_token",
      emailPrefix: "ops-cookie",
    });
    createdUserIds.push(fixture.userId);

    const cookieSession = await opsAuth.api.getSession({
      headers: new Headers({
        Cookie: fixture.cookieHeader,
      }),
    });

    expect(cookieSession?.user.email).toBe(fixture.email);

    const app = createApp();
    const opsResponse = await app.request("/api/auth/ops/get-session", {
      headers: {
        Cookie: fixture.cookieHeader,
      },
    });

    expect(opsResponse.status).toBe(200);
    const opsBody = (await opsResponse.json()) as { user?: { email?: string } } | null;
    expect(opsBody?.user?.email).toBe(fixture.email);
  });
});
