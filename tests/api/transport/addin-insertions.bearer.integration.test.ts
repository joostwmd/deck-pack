import { createDb } from "@deck-pack/db";
import { ensureMigrationsApplied } from "@deck-pack/db/test-utils/ensure-migrations";
import { assetInsertions } from "@deck-pack/db/schema/asset-insertions";
import { session, user } from "@deck-pack/db/schema/auth";
import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createSignedSessionFixture } from "../test-utils/create-signed-session-fixture";
import { trpcMutation, trpcQuery } from "../test-utils/trpc-request";
import { createApp } from "@deck-pack/api/server";

describe("addin insertions bearer transport", () => {
  const db = createDb();
  const createdUserIds: string[] = [];
  const truncateSql = `TRUNCATE TABLE asset_insertions, invitation, verification, session, account, member, organization, "user" RESTART IDENTITY CASCADE`;

  beforeAll(async () => {
    await ensureMigrationsApplied();
  });

  beforeEach(async () => {
    await db.execute(sql.raw(truncateSql));
  });

  afterAll(async () => {
    for (const userId of createdUserIds) {
      await db.delete(session).where(eq(session.userId, userId));
      await db.delete(user).where(eq(user.id, userId));
    }
  });

  it("rejects unauthenticated insertion tracking", async () => {
    const app = createApp();
    const { status, body } = await trpcMutation(app, "addin.insertions.track", {
      assetType: "logo",
      externalId: "brand-123",
      client: "office",
      metadata: {},
    });

    expect(status).not.toBe(200);
    expect(body.error?.json?.data?.code ?? body.error?.json?.message).toBeTruthy();
  });

  it("rejects invalid insertion payloads", async () => {
    const fixture = await createSignedSessionFixture({ emailPrefix: "addin-invalid" });
    createdUserIds.push(fixture.userId);

    const app = createApp();
    const { status, body } = await trpcMutation(
      app,
      "addin.insertions.track",
      {
        assetType: "logo",
        externalId: "",
        client: "office",
      },
      fixture.bearerToken,
    );

    expect(status).not.toBe(200);
    expect(body.error?.json?.data?.code).toBe("BAD_REQUEST");
  });

  it("persists tracked insertions for authenticated users", async () => {
    const fixture = await createSignedSessionFixture({ emailPrefix: "addin-track" });
    createdUserIds.push(fixture.userId);

    const app = createApp();
    const { status, body, text } = await trpcMutation<{ id: string }>(
      app,
      "addin.insertions.track",
      {
        assetType: "logo",
        externalId: "brand-123",
        client: "office",
        metadata: {
          variantId: "0",
          BRAND_NAME: "Acme",
        },
      },
      fixture.bearerToken,
    );

    expect(status, text).toBe(200);
    expect(body.result?.data?.json?.id).toBeTruthy();

    const rows = await db
      .select()
      .from(assetInsertions)
      .where(eq(assetInsertions.userId, fixture.userId));

    expect(rows).toHaveLength(1);
    expect(rows[0]?.assetType).toBe("logo");
    expect(rows[0]?.externalId).toBe("brand-123");
    expect(rows[0]?.metadata).toEqual({
      variantId: "0",
      BRAND_NAME: "Acme",
    });
  });

  it("does not require input for unrelated protected queries after tracking", async () => {
    const fixture = await createSignedSessionFixture({ emailPrefix: "addin-session" });
    createdUserIds.push(fixture.userId);

    const app = createApp();
    const listResponse = await trpcQuery<{ overrides: unknown[] }>(
      app,
      "shortcuts.list",
      undefined,
      fixture.bearerToken,
    );

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.result?.data?.json?.overrides).toEqual([]);
  });
});
