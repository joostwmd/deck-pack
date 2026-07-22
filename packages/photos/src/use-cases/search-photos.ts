import type { PhotoSearchInput, PhotoSearchResponse } from "../domain/photo";
import type { PhotoIntegrationPort } from "../integrations/photo-integration-port";

export class SearchPhotos {
  constructor(private readonly photoIntegration: PhotoIntegrationPort) {}

  async execute(input: PhotoSearchInput): Promise<PhotoSearchResponse> {
    return this.photoIntegration.search(input);
  }
}
