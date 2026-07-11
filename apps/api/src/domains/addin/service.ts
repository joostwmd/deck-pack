import type { BrandfetchClient } from "@deck-pack/brandfetch";
import type { Icons8Client } from "@deck-pack/icons8";
import type { PexelsClient, SearchPhotosInput } from "@deck-pack/pexels";

import { getFlagByIdMock, searchFlagsMock } from "../flags/mock-data";
import { mapFlagDetailsResponse, mapFlagSearchResponse } from "../flags/mappers";
import { mapIconDetailsResponse, mapIconSearchResponse } from "../icons/mappers";
import { mapLogoDetailsResponse, mapLogoSearchResponse } from "../logos/mappers";
import { mapPexelsSearchResponse } from "../photos/mappers";
import type { z } from "zod";

import { photoSearchInputSchema } from "./schemas";

export type AddinAssetServiceDeps = {
  brandfetch: BrandfetchClient;
  icons8: Icons8Client;
  pexels: PexelsClient;
};

export function createAddinAssetService(deps: AddinAssetServiceDeps) {
  const { brandfetch, icons8, pexels } = deps;

  return {
    searchLogos: async (query: string) => {
      const response = await brandfetch.searchBrands({ query });
      return mapLogoSearchResponse(response);
    },

    getLogoDetails: async (externalId: string) => {
      const response = await brandfetch.getBrandDetails({ brandId: externalId });
      return mapLogoDetailsResponse(response);
    },

    searchFlags: async (query: string) => {
      const results = searchFlagsMock(query);
      return mapFlagSearchResponse(results);
    },

    getFlagDetails: async (externalId: string) => {
      const flag = getFlagByIdMock(externalId);
      return flag ? mapFlagDetailsResponse(flag) : null;
    },

    searchIcons: async (query: string) => {
      const response = await icons8.searchIcons({ term: query });
      return mapIconSearchResponse(response);
    },

    getIconDetails: async (externalId: string) => {
      const response = await icons8.getIconById({ id: externalId });
      return mapIconDetailsResponse(response);
    },

    searchPhotos: async (input: z.infer<typeof photoSearchInputSchema>) => {
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

export type AddinAssetService = ReturnType<typeof createAddinAssetService>;
