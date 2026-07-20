import type { NounProjectClient } from "@deck-pack/integrations/noun-project";

import { mapIconDetailsResponse, mapIconSearchResponse } from "./mappers";

export type IconServiceDeps = {
  nounProject: NounProjectClient;
};

export function createIconService(deps: IconServiceDeps) {
  const { nounProject } = deps;

  return {
    search: async (query: string) => {
      const response = await nounProject.searchIcons({ query });
      return mapIconSearchResponse(response);
    },

    getDetails: async (externalId: string) => {
      const response = await nounProject.getIconDetails({ id: externalId });
      return mapIconDetailsResponse(response);
    },
  };
}

export type IconService = ReturnType<typeof createIconService>;
