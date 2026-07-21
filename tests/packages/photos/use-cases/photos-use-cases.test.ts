import { describe, expect, it } from "vitest";

import { InMemoryPhotoIntegration, SearchPhotos, type PhotoSearchResult } from "@deck-pack/photos";

function seedPhoto(overrides?: Partial<PhotoSearchResult>): PhotoSearchResult {
  return {
    id: "2014422",
    name: "Brown Rocks During Golden Hour",
    thumbnailUrl: "https://example.com/thumb.jpg",
    insertImageUrl: "https://example.com/insert.jpg",
    width: 3024,
    height: 3024,
    avgColor: "#978E82",
    photoUrl: "https://www.pexels.com/photo/2014422/",
    photographer: "Joey Farina",
    photographerUrl: "https://www.pexels.com/@joey",
    metadata: {
      PHOTOGRAPHER: "Joey Farina",
    },
    ...overrides,
  };
}

describe("photos use-cases", () => {
  it("searches seeded photos by name", async () => {
    const integration = new InMemoryPhotoIntegration();
    integration.seed([
      seedPhoto(),
      seedPhoto({
        id: "99",
        name: "City Skyline",
        photographer: "Other",
      }),
    ]);

    const result = await new SearchPhotos(integration).execute({
      query: "rocks",
      page: 1,
      perPage: 24,
    });

    expect(result.results).toHaveLength(1);
    expect(result.results[0]?.id).toBe("2014422");
    expect(result.totalResults).toBe(1);
    expect(result.hasNextPage).toBe(false);
  });
});
