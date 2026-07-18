import { getFlagByIdMock, searchFlagsMock } from "./mock-data";
import { mapFlagDetailsResponse, mapFlagSearchResponse } from "./mappers";

export function createFlagService() {
  return {
    search: async (query: string) => {
      const results = searchFlagsMock(query);
      return mapFlagSearchResponse(results);
    },

    getDetails: async (externalId: string) => {
      const flag = getFlagByIdMock(externalId);
      return flag ? mapFlagDetailsResponse(flag) : null;
    },
  };
}

export type FlagService = ReturnType<typeof createFlagService>;
