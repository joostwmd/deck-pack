import { createAppRouter } from "@deck-pack/api/trpc/router";
import { AppContainer } from "@deck-pack/api/container";
import { createApp } from "@deck-pack/api/server";
import { createDb, unitOfWork } from "@deck-pack/db";
import { ensureMigrationsApplied } from "@deck-pack/db/test-utils/ensure-migrations";
import { sql } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { InMemoryObjectStorage } from "@deck-pack/storage";

import {
  cleanupSignedSession,
  createSignedSessionFixture,
} from "../test-utils/create-signed-session-fixture";
import { seedReadyShape, seedReadySlide } from "../test-utils/seed-ready-gallery-fixture";
import { trpcQuery } from "../test-utils/trpc-request";

describe("assets slides and shapes bearer transport", () => {
  const db = createDb();
  const createdUserIds: string[] = [];
  const storage = new InMemoryObjectStorage();

  beforeAll(async () => {
    await ensureMigrationsApplied();
  });

  beforeEach(async () => {
    await db.execute(
      sql.raw(
        `TRUNCATE TABLE flag_variants, flag_items, shape_items, slide_items, gallery_item_names, gallery_items, files RESTART IDENTITY CASCADE`,
      ),
    );
    await seedReadySlide(unitOfWork, storage, {
      displayName: "Title Hero",
      category: "Intro",
      aspectRatio: "16:9",
      aliases: ["title"],
    });
    await seedReadyShape(unitOfWork, storage, {
      displayName: "Chevron",
      category: "Arrows",
    });
    await seedReadyShape(unitOfWork, storage, {
      displayName: "Ribbon",
      category: "Banners & Ribbons",
    });
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
