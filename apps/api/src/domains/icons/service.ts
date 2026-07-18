import type { Icons8Client } from "@deck-pack/integrations/icons8";

import { mapIconDetailsResponse, mapIconSearchResponse } from "./mappers";

export type IconServiceDeps = {
  icons8: Icons8Client;
};

export function createIconService(deps: IconServiceDeps) {
  const { icons8 } = deps;

  return {
    search: async (query: string) => {
      const response = await icons8.searchIcons({ term: query });
      return mapIconSearchResponse(response);
    },

    getDetails: async (externalId: string) => {
      const response = await icons8.getIconById({ id: externalId });
      return mapIconDetailsResponse(response);
    },
  };
}

export type IconService = ReturnType<typeof createIconService>;
