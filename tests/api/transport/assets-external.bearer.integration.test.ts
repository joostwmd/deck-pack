import { PexelsRateLimitError } from "@deck-pack/integrations/pexels";
import { createDb } from "@deck-pack/db";
import { session, user } from "@deck-pack/db/schema/auth";
import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it, vi } from "vitest";

import { createAppRouter } from "@deck-pack/api/api/router";
import { createSignedSessionFixture } from "../test-utils/create-signed-session-fixture";
import { trpcQuery } from "../test-utils/trpc-request";
import { createApp } from "@deck-pack/api/server";

const samplePhoto = {
  id: 2014422,
  width: 3024,
  height: 3024,
  url: "https://www.pexels.com/photo/brown-rocks-during-golden-hour-2014422/",
  photographer: "Joey Farina",
  photographer_url: "https://www.pexels.com/@joey",
  photographer_id: 680589,
  avg_color: "#978E82",
  src: {
    original: "https://images.pexels.com/photos/2014422/pexels-photo-2014422.jpeg",
    large2x:
      "https://images.pexels.com/photos/2014422/pexels-photo-2014422.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    large:
      "https://images.pexels.com/photos/2014422/pexels-photo-2014422.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    medium:
      "https://images.pexels.com/photos/2014422/pexels-photo-2014422.jpeg?auto=compress&cs=tinysrgb&h=350",
    small:
      "https://images.pexels.com/photos/2014422/pexels-photo-2014422.jpeg?auto=compress&cs=tinysrgb&h=130",
    portrait:
      "https://images.pexels.com/photos/2014422/pexels-photo-2014422.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
    landscape:
      "https://images.pexels.com/photos/2014422/pexels-photo-2014422.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    tiny:
      "https://images.pexels.com/photos/2014422/pexels-photo-2014422.jpeg?auto=compress&cs=tinysrgb&dpr=1&fit=crop&h=200&w=280",
  },
  alt: "Brown Rocks During Golden Hour",
};

function createExternalAssetsApp() {
  const pexels = {
    searchPhotos: vi.fn().mockResolvedValue({
      page: 1,
      per_page: 24,
      total_results: 1,
      photos: [samplePhoto],
    }),
  };
  const icons8 = {
    searchIcons: vi.fn().mockResolvedValue({
      icons: [{ id: "icon-1", name: "Arrow", previewUrl: "https://example.com/arrow.png" }],
    }),
    getIconById: vi.fn().mockResolvedValue({
      id: "icon-1",
      name: "Arrow",
      variants: [
        {
          platform: "ios7",
          previewUrl: "https://example.com/arrow-ios7.png",
          svg: "<svg />",
        },
      ],
    }),
  };
  const brandfetch = {
    searchBrands: vi.fn().mockResolvedValue({
      results: [
        {
          id: "brand-1",
          brandId: "brand-1",
          name: "Acme",
          domain: "acme.com",
          logo: "https://example.com/acme.png",
        },
      ],
    }),
    getBrandDetails: vi.fn().mockResolvedValue({
      brandId: "brand-1",
      name: "Acme",
      logos: [
        {
          type: "logo",
          theme: "dark",
          formats: [{ src: "https://example.com/acme-dark.png" }],
        },
      ],
    }),
  };

  const router = createAppRouter({
    brandfetchApiKey: "test",
    icons8ApiKey: "test",
    pexelsApiKey: "test",
    pexels: pexels as never,
    icons8: icons8 as never,
    brandfetch: brandfetch as never,
  });

  return {
    app: createApp({ router }),
    pexels,
    icons8,
    brandfetch,
  };
}

describe("assets external integrations bearer transport", () => {
  const db = createDb();
  const createdUserIds: string[] = [];

  afterAll(async () => {
    for (const userId of createdUserIds) {
      await db.delete(session).where(eq(session.userId, userId));
      await db.delete(user).where(eq(user.id, userId));
    }
  });

  it("searches photos through injected pexels client", async () => {
    const fixture = await createSignedSessionFixture({ emailPrefix: "photos-search" });
    createdUserIds.push(fixture.userId);
    const { app, pexels } = createExternalAssetsApp();

    const { status, body, text } = await trpcQuery<{
      results: Array<{ id: string }>;
    }>(app, "assets.photos.search", { query: "ocean" }, fixture.bearerToken);

    expect(status, text).toBe(200);
    expect(pexels.searchPhotos).toHaveBeenCalled();
    expect(body.result?.data?.json?.results[0]?.id).toBe("2014422");
  });

  it("maps pexels rate limits to too many requests", async () => {
    const fixture = await createSignedSessionFixture({ emailPrefix: "photos-rate-limit" });
    createdUserIds.push(fixture.userId);
    const { app, pexels } = createExternalAssetsApp();
    pexels.searchPhotos.mockRejectedValue(new PexelsRateLimitError("Rate limited"));

    const { status, body } = await trpcQuery(
      app,
      "assets.photos.search",
      { query: "ocean" },
      fixture.bearerToken,
    );

    expect(status).not.toBe(200);
    expect(body.error?.json?.data?.code).toBe("TOO_MANY_REQUESTS");
  });

  it("searches icons and loads details through injected icons8 client", async () => {
    const fixture = await createSignedSessionFixture({ emailPrefix: "icons-search" });
    createdUserIds.push(fixture.userId);
    const { app, icons8 } = createExternalAssetsApp();

    const searchResponse = await trpcQuery<{ results: Array<{ id: string }> }>(
      app,
      "assets.icons.search",
      { query: "arrow" },
      fixture.bearerToken,
    );
    const detailsResponse = await trpcQuery<{ variants: Array<{ id: string }> }>(
      app,
      "assets.icons.getDetails",
      { externalId: "icon-1" },
      fixture.bearerToken,
    );

    expect(searchResponse.status).toBe(200);
    expect(detailsResponse.status).toBe(200);
    expect(icons8.searchIcons).toHaveBeenCalledWith({ term: "arrow" });
    expect(icons8.getIconById).toHaveBeenCalledWith({ id: "icon-1" });
    expect(detailsResponse.body.result?.data?.json?.variants[0]?.id).toBe("ios7");
  });

  it("searches logos and loads details through injected brandfetch client", async () => {
    const fixture = await createSignedSessionFixture({ emailPrefix: "logos-search" });
    createdUserIds.push(fixture.userId);
    const { app, brandfetch } = createExternalAssetsApp();

    const searchResponse = await trpcQuery<{ results: Array<{ id: string; name: string }> }>(
      app,
      "assets.logos.search",
      { query: "acme" },
      fixture.bearerToken,
    );
    const detailsResponse = await trpcQuery<{ id: string; variants: Array<{ id: string }> }>(
      app,
      "assets.logos.getDetails",
      { externalId: "brand-1" },
      fixture.bearerToken,
    );

    expect(searchResponse.status).toBe(200);
    expect(detailsResponse.status).toBe(200);
    expect(brandfetch.searchBrands).toHaveBeenCalledWith({ query: "acme" });
    expect(brandfetch.getBrandDetails).toHaveBeenCalledWith({ brandId: "brand-1" });
    expect(searchResponse.body.result?.data?.json?.results[0]?.name).toBe("Acme");
    expect(detailsResponse.body.result?.data?.json?.variants).toHaveLength(1);
  });

  it("rejects unauthenticated logo details queries", async () => {
    const { app } = createExternalAssetsApp();
    const { status, body } = await trpcQuery(app, "assets.logos.getDetails", {
      externalId: "brand-1",
    });

    expect(status).not.toBe(200);
    expect(body.error?.json?.data?.code ?? body.error?.json?.message).toBeTruthy();
  });
});
