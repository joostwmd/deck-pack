import type { PexelsPhoto, PexelsSearchResponse } from "@deck-pack/integrations/pexels";

import type { PhotoSearchResponse, PhotoSearchResult } from "../domain/photo";

export function mapPexelsPhoto(photo: PexelsPhoto): PhotoSearchResult {
  const insertImageUrl = photo.src.large2x || photo.src.large || photo.src.original;
  const thumbnailUrl = photo.src.medium || photo.src.tiny || photo.src.small;

  return {
    id: String(photo.id),
    name: photo.alt || `Photo by ${photo.photographer}`,
    thumbnailUrl,
    insertImageUrl,
    width: photo.width,
    height: photo.height,
    avgColor: photo.avg_color,
    photoUrl: photo.url,
    photographer: photo.photographer,
    photographerUrl: photo.photographer_url,
    metadata: {
      PHOTOGRAPHER: photo.photographer,
      PHOTOGRAPHER_URL: photo.photographer_url,
      PHOTO_URL: photo.url,
      PHOTO_WIDTH: String(photo.width),
      PHOTO_HEIGHT: String(photo.height),
      INSERT_SOURCE: "large2x",
    },
  };
}

export function mapPexelsSearchResponse(response: PexelsSearchResponse): PhotoSearchResponse {
  return {
    results: response.photos.map(mapPexelsPhoto),
    page: response.page,
    perPage: response.per_page,
    totalResults: response.total_results,
    hasNextPage: response.next_page != null,
  };
}
