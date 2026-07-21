import type { PhotoSearchInput, PhotoSearchResponse, PhotoSearchResult } from "../domain/photo";
import type { PhotoIntegrationPort } from "./photo-integration-port";

export class InMemoryPhotoIntegration implements PhotoIntegrationPort {
  private readonly seeded: PhotoSearchResult[] = [];

  seed(results: PhotoSearchResult[]): void {
    this.seeded.push(...results);
  }

  async search(input: PhotoSearchInput): Promise<PhotoSearchResponse> {
    const normalized = input.query.toLowerCase();
    const results = this.seeded.filter(
      (photo) =>
        photo.name.toLowerCase().includes(normalized) ||
        photo.id.toLowerCase().includes(normalized) ||
        photo.photographer.toLowerCase().includes(normalized),
    );
    const page = input.page ?? 1;
    const perPage = input.perPage ?? 24;

    return {
      results,
      page,
      perPage,
      totalResults: results.length,
      hasNextPage: false,
    };
  }
}
