import type { PexelsClient, SearchPhotosInput } from "@deck-pack/integrations/pexels";
import { PexelsRateLimitError } from "@deck-pack/integrations/pexels";

import { PhotoRateLimitError } from "../domain/errors";
import type { PhotoSearchInput, PhotoSearchResponse } from "../domain/photo";
import type { PhotoIntegrationPort } from "./photo-integration-port";
import { mapPexelsSearchResponse } from "./mappers";

export class PexelsPhotoIntegration implements PhotoIntegrationPort {
  constructor(private readonly client: PexelsClient) {}

  async search(input: PhotoSearchInput): Promise<PhotoSearchResponse> {
    try {
      const searchInput: SearchPhotosInput = {
        query: input.query,
        orientation: input.orientation,
        size: input.size,
        color: input.color as SearchPhotosInput["color"],
        locale: input.locale as SearchPhotosInput["locale"],
        page: input.page,
        perPage: input.perPage,
      };
      const response = await this.client.searchPhotos(searchInput);
      return mapPexelsSearchResponse(response);
    } catch (error) {
      if (error instanceof PexelsRateLimitError) {
        throw new PhotoRateLimitError({ cause: error });
      }
      throw error;
    }
  }
}
