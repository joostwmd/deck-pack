import { createDb } from "@deck-pack/db";
import { session, user } from "@deck-pack/db/schema/auth";
import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";

import { createSignedSessionFixture } from "../test-utils/create-signed-session-fixture";
import { trpcQuery } from "../test-utils/trpc-request";
import { createApp } from "@deck-pack/api/server";

describe("assets flags bearer transport", () => {
  const db = createDb();
  const createdUserIds: string[] = [];

  afterAll(async () => {
    for (const userId of createdUserIds) {
      await db.delete(session).where(eq(session.userId, userId));
      await db.delete(user).where(eq(user.id, userId));
    }
  });

  it("rejects unauthenticated flag search", async () => {
    const app = createApp();
    const { status, body } = await trpcQuery(app, "assets.flags.search", { query: "nether" });

    expect(status).not.toBe(200);
    expect(body.error?.json?.data?.code ?? body.error?.json?.message).toBeTruthy();
  });

  it("returns flag search results for authenticated users", async () => {
    const fixture = await createSignedSessionFixture({ emailPrefix: "flags-search" });
    createdUserIds.push(fixture.userId);

    const app = createApp();
    const { status, body, text } = await trpcQuery<{
      results: Array<{ id: string; name: string; imageUrl: string }>;
    }>(app, "assets.flags.search", { query: "germany" }, fixture.bearerToken);

    expect(status, text).toBe(200);
    expect(body.result?.data?.json?.results.length).toBeGreaterThan(0);
    expect(body.result?.data?.json?.results[0]?.name).toMatch(/germany/i);
  });

  it("returns flag details with variants", async () => {
    const fixture = await createSignedSessionFixture({ emailPrefix: "flags-details" });
    createdUserIds.push(fixture.userId);

    const app = createApp();
    const { status, body, text } = await trpcQuery<{
      id: string;
      name: string;
      variants: Array<{ id: string; name: string }>;
    }>(app, "assets.flags.getDetails", { externalId: "flag_de" }, fixture.bearerToken);

    expect(status, text).toBe(200);
    expect(body.result?.data?.json?.id).toBe("flag_de");
    expect(body.result?.data?.json?.variants.length).toBeGreaterThan(0);
  });

  it("returns not found for unknown flag ids", async () => {
    const fixture = await createSignedSessionFixture({ emailPrefix: "flags-missing" });
    createdUserIds.push(fixture.userId);

    const app = createApp();
    const { status, body } = await trpcQuery(
      app,
      "assets.flags.getDetails",
      { externalId: "flag_does_not_exist" },
      fixture.bearerToken,
    );

    expect(status).not.toBe(200);
    expect(body.error?.json?.data?.code).toBe("NOT_FOUND");
  });
});
