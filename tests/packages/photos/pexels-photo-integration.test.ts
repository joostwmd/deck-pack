import { PexelsRateLimitError } from "@deck-pack/integrations/pexels";
import {
  PhotoRateLimitError,
  PexelsPhotoIntegration,
  mapPexelsPhoto,
  mapPexelsSearchResponse,
} from "@deck-pack/photos";
import { describe, expect, it, vi } from "vitest";

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
    tiny: "https://images.pexels.com/photos/2014422/pexels-photo-2014422.jpeg?auto=compress&cs=tinysrgb&dpr=1&fit=crop&h=200&w=280",
  },
  alt: "Brown Rocks During Golden Hour",
};

describe("PexelsPhotoIntegration", () => {
  it("maps pexels search responses", async () => {
    const searchPhotos = vi.fn().mockResolvedValue({
      page: 1,
      per_page: 24,
      total_results: 1,
      photos: [samplePhoto],
    });

    const integration = new PexelsPhotoIntegration({ searchPhotos } as never);

    const result = await integration.search({
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
    const integration = new PexelsPhotoIntegration({
      searchPhotos: vi.fn().mockResolvedValue({
        page: 1,
        per_page: 24,
        total_results: 0,
        photos: [],
      }),
    } as never);

    const result = await integration.search({
      query: "nothing-here",
      page: 1,
      perPage: 24,
    });

    expect(result.results).toEqual([]);
    expect(result.totalResults).toBe(0);
  });

  it("maps PexelsRateLimitError to PhotoRateLimitError", async () => {
    const integration = new PexelsPhotoIntegration({
      searchPhotos: vi
        .fn()
        .mockRejectedValue(new PexelsRateLimitError({ limit: 200, remaining: 0, reset: null })),
    } as never);

    await expect(
      integration.search({
        query: "ocean",
        page: 1,
        perPage: 24,
      }),
    ).rejects.toBeInstanceOf(PhotoRateLimitError);
  });
});

describe("photo mappers", () => {
  it("maps photo search results with attribution and insertion URLs", () => {
    const mapped = mapPexelsPhoto(samplePhoto);

    expect(mapped).toEqual({
      id: "2014422",
      name: "Brown Rocks During Golden Hour",
      thumbnailUrl: samplePhoto.src.medium,
      insertImageUrl: samplePhoto.src.large2x,
      width: 3024,
      height: 3024,
      avgColor: "#978E82",
      photoUrl: samplePhoto.url,
      photographer: "Joey Farina",
      photographerUrl: samplePhoto.photographer_url,
      metadata: {
        PHOTOGRAPHER: "Joey Farina",
        PHOTOGRAPHER_URL: samplePhoto.photographer_url,
        PHOTO_URL: samplePhoto.url,
        PHOTO_WIDTH: "3024",
        PHOTO_HEIGHT: "3024",
        INSERT_SOURCE: "large2x",
      },
    });
  });

  it("derives pagination metadata without exposing upstream URLs", () => {
    const mapped = mapPexelsSearchResponse({
      page: 2,
      per_page: 24,
      total_results: 120,
      next_page: "https://api.pexels.com/v1/search?page=3&per_page=24&query=nature",
      photos: [samplePhoto],
    });

    expect(mapped.page).toBe(2);
    expect(mapped.perPage).toBe(24);
    expect(mapped.totalResults).toBe(120);
    expect(mapped.hasNextPage).toBe(true);
    expect(mapped.results).toHaveLength(1);
    expect(JSON.stringify(mapped)).not.toContain("api.pexels.com");
  });
});
