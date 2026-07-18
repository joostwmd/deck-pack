import { PexelsRateLimitError } from "@deck-pack/integrations/pexels";
import { describe, expect, it, vi } from "vitest";

import { createPhotoService } from "@deck-pack/api/domains/photos/service";

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

describe("createPhotoService", () => {
  it("maps pexels search responses", async () => {
    const searchPhotos = vi.fn().mockResolvedValue({
      page: 1,
      per_page: 24,
      total_results: 1,
      photos: [samplePhoto],
    });

    const service = createPhotoService({
      pexels: { searchPhotos } as never,
    });

    const result = await service.search({
      query: "ocean",
      page: 1,
      perPage: 24,
    });

    expect(searchPhotos).toHaveBeenCalledWith({
      query: "ocean",
      orientation: undefined,
      size: undefined,
      color: undefined,
      locale: undefined,
      page: 1,
      perPage: 24,
    });
    expect(result.results).toHaveLength(1);
    expect(result.results[0]?.id).toBe("2014422");
    expect(result.hasNextPage).toBe(false);
  });

  it("returns empty results when pexels has no matches", async () => {
    const service = createPhotoService({
      pexels: {
        searchPhotos: vi.fn().mockResolvedValue({
          page: 1,
          per_page: 24,
          total_results: 0,
          photos: [],
        }),
      } as never,
    });

    const result = await service.search({
      query: "nothing-here",
      page: 1,
      perPage: 24,
    });

    expect(result.results).toEqual([]);
    expect(result.totalResults).toBe(0);
  });

  it("propagates pexels rate limit errors", async () => {
    const service = createPhotoService({
      pexels: {
        searchPhotos: vi.fn().mockRejectedValue(new PexelsRateLimitError("Rate limited")),
      } as never,
    });

    await expect(
      service.search({
        query: "ocean",
        page: 1,
        perPage: 24,
      }),
    ).rejects.toBeInstanceOf(PexelsRateLimitError);
  });
});
