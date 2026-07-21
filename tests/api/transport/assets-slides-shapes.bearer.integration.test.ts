import { createAppRouter } from "@deck-pack/api/trpc/router";
import { AppContainer } from "@deck-pack/api/container";
import { createApp } from "@deck-pack/api/server";
import { createDb } from "@deck-pack/db";
import { session, user } from "@deck-pack/db/schema/auth";
import { ensureMigrationsApplied } from "@deck-pack/db/test-utils/ensure-migrations";
import { tx } from "@deck-pack/db/transaction";
import { sql } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createMemoryObjectStorage } from "@deck-pack/storage";

import { createSignedSessionFixture } from "../test-utils/create-signed-session-fixture";
import { seedReadyShape, seedReadySlide } from "../test-utils/seed-ready-library-fixture";
import { trpcQuery } from "../test-utils/trpc-request";

describe("assets slides and shapes bearer transport", () => {
  const db = createDb();
  const createdUserIds: string[] = [];
  const storage = createMemoryObjectStorage();

  beforeAll(async () => {
    await ensureMigrationsApplied();
  });

  beforeEach(async () => {
    await tx.execute(
      sql.raw(
        `TRUNCATE TABLE flag_variants, flag_items, shape_items, slide_items, library_item_names, library_items, files RESTART IDENTITY CASCADE`,
      ),
    );
    await seedReadySlide(tx, storage, {
      displayName: "Title Hero",
      category: "Intro",
      aspectRatio: "16:9",
      aliases: ["title"],
    });
    await seedReadyShape(tx, storage, {
      displayName: "Chevron",
      category: "Arrows",
    });
    await seedReadyShape(tx, storage, {
      displayName: "Ribbon",
      category: "Banners & Ribbons",
    });
  });

  afterAll(async () => {
    for (const userId of createdUserIds) {
      await db.delete(session).where(eq(session.userId, userId));
      await db.delete(user).where(eq(user.id, userId));
    }
  });

  function createTestApp() {
    return createApp({
      router: createAppRouter(
        {
          brandfetchApiKey: "dummy-key-for-now",
          brandfetchClientId: "dummy-client-id-for-now",
          nounProjectApiKey: "dummy-key-for-now",
          nounProjectApiSecret: "dummy-secret-for-now",
          pexelsApiKey: "dummy-key-for-now",
          storage,
        },
        AppContainer.forUnitTest(),
      ),
    });
  }

  it("rejects unauthenticated slide search", async () => {
    const app = createTestApp();
    const { status, body } = await trpcQuery(app, "assets.slides.search", {});

    expect(status).not.toBe(200);
    expect(body.error?.json?.data?.code ?? body.error?.json?.message).toBeTruthy();
  });

  it("returns slide search results for authenticated users", async () => {
    const fixture = await createSignedSessionFixture({ emailPrefix: "slides-search" });
    createdUserIds.push(fixture.userId);

    const app = createTestApp();
    const { status, body, text } = await trpcQuery<{
      results: Array<{ id: string; name: string }>;
      total: number;
      facets: { categories: string[] };
    }>(app, "assets.slides.search", {}, fixture.bearerToken);

    expect(status, text).toBe(200);
    expect(body.result?.data?.json?.results.length).toBe(1);
    expect(body.result?.data?.json?.total).toBe(1);
    expect(body.result?.data?.json?.facets.categories).toContain("Intro");
  });

  it("filters slide search results by query", async () => {
    const fixture = await createSignedSessionFixture({ emailPrefix: "slides-filter" });
    createdUserIds.push(fixture.userId);

    const app = createTestApp();
    const allResults = await trpcQuery<{
      results: Array<{ id: string }>;
      total: number;
    }>(app, "assets.slides.search", {}, fixture.bearerToken);

    const filteredResults = await trpcQuery<{
      results: Array<{ id: string }>;
      total: number;
    }>(app, "assets.slides.search", { query: "zzzz-no-match-zzzz" }, fixture.bearerToken);

    expect(allResults.status).toBe(200);
    expect(filteredResults.status).toBe(200);
    expect(allResults.body.result?.data?.json?.total).toBe(1);
    expect(filteredResults.body.result?.data?.json?.total).toBe(0);
  });

  it("returns shape search results for authenticated users", async () => {
    const fixture = await createSignedSessionFixture({ emailPrefix: "shapes-search" });
    createdUserIds.push(fixture.userId);

    const app = createTestApp();
    const { status, body, text } = await trpcQuery<{
      results: Array<{ id: string; name: string }>;
      total: number;
      facets: { categories: string[] };
    }>(app, "assets.shapes.search", {}, fixture.bearerToken);

    expect(status, text).toBe(200);
    expect(body.result?.data?.json?.results.length).toBe(2);
    expect(body.result?.data?.json?.total).toBe(2);
    expect(body.result?.data?.json?.facets.categories).toContain("Arrows");
  });

  it("filters shape results by category", async () => {
    const fixture = await createSignedSessionFixture({ emailPrefix: "shapes-filter" });
    createdUserIds.push(fixture.userId);

    const app = createTestApp();
    const allResults = await trpcQuery<{ total: number }>(
      app,
      "assets.shapes.search",
      {},
      fixture.bearerToken,
    );
    const filteredResults = await trpcQuery<{ total: number }>(
      app,
      "assets.shapes.search",
      { category: "Arrows" },
      fixture.bearerToken,
    );

    expect(allResults.status).toBe(200);
    expect(filteredResults.status).toBe(200);
    expect(allResults.body.result?.data?.json?.total).toBe(2);
    expect(filteredResults.body.result?.data?.json?.total).toBe(1);
  });
});
