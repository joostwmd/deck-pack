import { createAppRouter } from "@deck-pack/api/api/router";
import { createApp } from "@deck-pack/api/server";
import { createDb } from "@deck-pack/db";
import { session, user } from "@deck-pack/db/schema/auth";
import { ensureMigrationsApplied } from "@deck-pack/db/test-utils/ensure-migrations";
import { tx } from "@deck-pack/db/transaction";
import { createMemoryObjectStorage } from "@deck-pack/storage";
import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createSignedSessionFixture } from "../test-utils/create-signed-session-fixture";
import { seedReadyFlag } from "../test-utils/seed-ready-library-fixture";
import { trpcQuery } from "../test-utils/trpc-request";

describe("assets flags bearer transport", () => {
  const db = createDb();
  const createdUserIds: string[] = [];
  const storage = createMemoryObjectStorage();
  let seededFlagId = "";

  beforeAll(async () => {
    await ensureMigrationsApplied();
  });

  beforeEach(async () => {
    await tx.execute(
      sql.raw(
        `TRUNCATE TABLE flag_variants, flag_items, shape_items, slide_items, library_item_names, library_items, files RESTART IDENTITY CASCADE`,
      ),
    );
    const seeded = await seedReadyFlag(tx, storage, {
      displayName: "Germany",
      code: "DE",
      aliases: ["deutschland"],
    });
    seededFlagId = seeded.id;
  });

  afterAll(async () => {
    for (const userId of createdUserIds) {
      await db.delete(session).where(eq(session.userId, userId));
      await db.delete(user).where(eq(user.id, userId));
    }
  });

  function createTestApp() {
    return createApp({
      router: createAppRouter({
        brandfetchApiKey: "dummy-key-for-now",
        brandfetchClientId: "dummy-client-id-for-now",
        nounProjectApiKey: "dummy-key-for-now",
        nounProjectApiSecret: "dummy-secret-for-now",
        pexelsApiKey: "dummy-key-for-now",
        storage,
      }),
    });
  }

  it("rejects unauthenticated flag search", async () => {
    const app = createTestApp();
    const { status, body } = await trpcQuery(app, "assets.flags.search", { query: "nether" });

    expect(status).not.toBe(200);
    expect(body.error?.json?.data?.code ?? body.error?.json?.message).toBeTruthy();
  });

  it("returns flag search results for authenticated users", async () => {
    const fixture = await createSignedSessionFixture({ emailPrefix: "flags-search" });
    createdUserIds.push(fixture.userId);

    const app = createTestApp();
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

    const app = createTestApp();
    const { status, body, text } = await trpcQuery<{
      id: string;
      name: string;
      variants: Array<{ id: string; name: string }>;
    }>(app, "assets.flags.getDetails", { externalId: seededFlagId }, fixture.bearerToken);

    expect(status, text).toBe(200);
    expect(body.result?.data?.json?.id).toBe(seededFlagId);
    expect(body.result?.data?.json?.variants.length).toBeGreaterThan(0);
  });

  it("returns not found for unknown flag ids", async () => {
    const fixture = await createSignedSessionFixture({ emailPrefix: "flags-missing" });
    createdUserIds.push(fixture.userId);

    const app = createTestApp();
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
