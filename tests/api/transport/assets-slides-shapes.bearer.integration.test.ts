import { createDb } from "@deck-pack/db";
import { session, user } from "@deck-pack/db/schema/auth";
import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";

import { createSignedSessionFixture } from "../test-utils/create-signed-session-fixture";
import { trpcQuery } from "../test-utils/trpc-request";
import { createApp } from "@deck-pack/api/server";

describe("assets slides and shapes bearer transport", () => {
  const db = createDb();
  const createdUserIds: string[] = [];

  afterAll(async () => {
    for (const userId of createdUserIds) {
      await db.delete(session).where(eq(session.userId, userId));
      await db.delete(user).where(eq(user.id, userId));
    }
  });

  it("rejects unauthenticated slide search", async () => {
    const app = createApp();
    const { status, body } = await trpcQuery(app, "assets.slides.search", {});

    expect(status).not.toBe(200);
    expect(body.error?.json?.data?.code ?? body.error?.json?.message).toBeTruthy();
  });

  it("returns slide search results for authenticated users", async () => {
    const fixture = await createSignedSessionFixture({ emailPrefix: "slides-search" });
    createdUserIds.push(fixture.userId);

    const app = createApp();
    const { status, body, text } = await trpcQuery<{
      results: Array<{ id: string; name: string }>;
      total: number;
      facets: { categories: string[] };
    }>(app, "assets.slides.search", {}, fixture.bearerToken);

    expect(status, text).toBe(200);
    expect(body.result?.data?.json?.results.length).toBeGreaterThan(0);
    expect(body.result?.data?.json?.total).toBeGreaterThan(0);
    expect(body.result?.data?.json?.facets.categories.length).toBeGreaterThan(0);
  });

  it("filters slide search results by query", async () => {
    const fixture = await createSignedSessionFixture({ emailPrefix: "slides-filter" });
    createdUserIds.push(fixture.userId);

    const app = createApp();
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
    expect(allResults.body.result?.data?.json?.total).toBeGreaterThan(
      filteredResults.body.result?.data?.json?.total ?? Number.MAX_SAFE_INTEGER,
    );
  });

  it("returns shape search results for authenticated users", async () => {
    const fixture = await createSignedSessionFixture({ emailPrefix: "shapes-search" });
    createdUserIds.push(fixture.userId);

    const app = createApp();
    const { status, body, text } = await trpcQuery<{
      results: Array<{ id: string; name: string }>;
      total: number;
      facets: { categories: string[] };
    }>(app, "assets.shapes.search", {}, fixture.bearerToken);

    expect(status, text).toBe(200);
    expect(body.result?.data?.json?.results.length).toBeGreaterThan(0);
    expect(body.result?.data?.json?.total).toBeGreaterThan(0);
    expect(body.result?.data?.json?.facets.categories.length).toBeGreaterThan(0);
  });

  it("filters shape results by category", async () => {
    const fixture = await createSignedSessionFixture({ emailPrefix: "shapes-filter" });
    createdUserIds.push(fixture.userId);

    const app = createApp();
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
    expect(allResults.body.result?.data?.json?.total).toBeGreaterThan(
      filteredResults.body.result?.data?.json?.total ?? Number.MAX_SAFE_INTEGER,
    );
  });
});
