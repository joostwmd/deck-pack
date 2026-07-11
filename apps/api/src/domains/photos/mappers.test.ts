import { describe, expect, it } from "vitest";

import { mapPexelsPhoto, mapPexelsSearchResponse } from "./mappers";

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
