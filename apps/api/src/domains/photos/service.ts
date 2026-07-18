import type { PexelsClient, SearchPhotosInput } from "@deck-pack/integrations/pexels";
import type { z } from "zod";

import { mapPexelsSearchResponse } from "./mappers";
import type { photoSearchInputSchema } from "./schemas";

export type PhotoServiceDeps = {
  pexels: PexelsClient;
};

export function createPhotoService(deps: PhotoServiceDeps) {
  const { pexels } = deps;

  return {
    search: async (input: z.infer<typeof photoSearchInputSchema>) => {
      const searchInput: SearchPhotosInput = {
        query: input.query,
        orientation: input.orientation,
        size: input.size,
        color: input.color as SearchPhotosInput["color"],
        locale: input.locale,
        page: input.page,
        perPage: input.perPage,
      };

      const response = await pexels.searchPhotos(searchInput);
      return mapPexelsSearchResponse(response);
    },
  };
}

export type PhotoService = ReturnType<typeof createPhotoService>;
