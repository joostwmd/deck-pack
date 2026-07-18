import type { BrandfetchClient } from "@deck-pack/integrations/brandfetch";

import { mapLogoDetailsResponse, mapLogoSearchResponse } from "./mappers";

export type LogoServiceDeps = {
  brandfetch: BrandfetchClient;
};

export function createLogoService(deps: LogoServiceDeps) {
  const { brandfetch } = deps;

  return {
    search: async (query: string) => {
      const response = await brandfetch.searchBrands({ query });
      return mapLogoSearchResponse(response);
    },

    getDetails: async (externalId: string) => {
      const response = await brandfetch.getBrandDetails({ brandId: externalId });
      return mapLogoDetailsResponse(response);
    },
  };
}

export type LogoService = ReturnType<typeof createLogoService>;
