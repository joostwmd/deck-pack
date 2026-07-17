import type { BrandfetchClient } from "@deck-pack/brandfetch";
import type { Icons8Client } from "@deck-pack/icons8";
import type { PexelsClient, SearchPhotosInput } from "@deck-pack/pexels";
import type { insertAssetInsertion } from "@deck-pack/db/queries/insertAssetInsertion";
import type { Transaction } from "@deck-pack/db/transaction";

import { serviceFail, serviceOk, type ServiceResult } from "../../api/resilience/service-result";

import { getFlagByIdMock, searchFlagsMock } from "../flags/mock-data";
import { mapFlagDetailsResponse, mapFlagSearchResponse } from "../flags/mappers";
import { mapIconDetailsResponse, mapIconSearchResponse } from "../icons/mappers";
import { mapLogoDetailsResponse, mapLogoSearchResponse } from "../logos/mappers";
import { mapPexelsSearchResponse } from "../photos/mappers";
import { searchShapesMock } from "../shapes/mock-data";
import { searchSlidesMock } from "../slides/mock-data";
import type { z } from "zod";

import { photoSearchInputSchema, shapeSearchInputSchema, slideSearchInputSchema } from "./schemas";

export type AddinAssetServiceDeps = {
  brandfetch: BrandfetchClient;
  icons8: Icons8Client;
  pexels: PexelsClient;
  insertAssetInsertion: typeof insertAssetInsertion;
};

export function createAddinAssetService(deps: AddinAssetServiceDeps) {
  const { brandfetch, icons8, pexels, insertAssetInsertion } = deps;

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

    searchSlides: async (input: z.infer<typeof slideSearchInputSchema>) => {
      return searchSlidesMock(input);
    },

    searchShapes: async (input: z.infer<typeof shapeSearchInputSchema>) => {
      return searchShapesMock(input);
    },

    trackInsertion: async (
      tx: Transaction,
      input: {
        userId: string;
        assetType: Parameters<typeof insertAssetInsertion>[0]["input"]["assetType"];
        externalId: string;
        client: "office" | "web";
        metadata: Record<string, unknown>;
      },
    ): Promise<ServiceResult<{ id: string }>> => {
      const row = await insertAssetInsertion({
        tx,
        input: {
          userId: input.userId,
          assetType: input.assetType,
          externalId: input.externalId,
          client: input.client,
          metadata: input.metadata,
        },
      });

      if (!row) {
        return serviceFail("internal", { message: "Failed to track asset insertion" });
      }

      return serviceOk({ id: row.id });
    },
  };
}

export type AddinAssetService = ReturnType<typeof createAddinAssetService>;
