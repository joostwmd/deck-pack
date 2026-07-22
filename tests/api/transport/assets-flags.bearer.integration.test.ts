import { createAppRouter } from "@deck-pack/api/trpc/router";
import { AppContainer } from "@deck-pack/api/container";
import { createApp } from "@deck-pack/api/server";
import { createDb, unitOfWork } from "@deck-pack/db";
import { ensureMigrationsApplied } from "@deck-pack/db/test-utils/ensure-migrations";
import { InMemoryObjectStorage } from "@deck-pack/storage";
import { sql } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import {
  cleanupSignedSession,
  createSignedSessionFixture,
} from "../test-utils/create-signed-session-fixture";
import { seedReadyFlag } from "../test-utils/seed-ready-gallery-fixture";
import { trpcQuery } from "../test-utils/trpc-request";

describe("assets flags bearer transport", () => {
  const db = createDb();
  const createdUserIds: string[] = [];
  const storage = new InMemoryObjectStorage();
  let seededFlagId = "";

  beforeAll(async () => {
    await ensureMigrationsApplied();
  });

  beforeEach(async () => {
    await db.execute(
      sql.raw(
        `TRUNCATE TABLE flag_variants, flag_items, shape_items, slide_items, gallery_item_names, gallery_items, files RESTART IDENTITY CASCADE`,
      ),
    );
    const seeded = await seedReadyFlag(unitOfWork, storage, {
      displayName: "Germany",
      code: "DE",
      aliases: ["deutschland"],
    });
    seededFlagId = seeded.id;
  });

  afterAll(async () => {
    for (const userId of createdUserIds) {
      await cleanupSignedSession(userId);
    }
  });

  function createTestApp() {
    const container = AppContainer.forIntegrationTest(db, { objectStorage: storage });
    return createApp({
      router: createAppRouter(container.toRouterDeps(), container),
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
