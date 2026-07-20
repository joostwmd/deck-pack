import {
  getReadyFlagDetails,
  searchReadyFlags,
} from "@deck-pack/db/queries/libraryDiscovery";
import type { Transaction } from "@deck-pack/db/transaction";
import type { ObjectStorage } from "@deck-pack/storage";

import { createDiscoveryDownloadUrl } from "../library/signed-urls";

import { mapFlagDetailsResponse, mapFlagSearchResponse } from "./mappers";

export type FlagServiceDeps = {
  storage: ObjectStorage;
};

export function createFlagService(deps: FlagServiceDeps) {
  return {
    search: async (tx: Transaction, query: string) => {
      const rows = await searchReadyFlags({ tx, query });
      const withUrls: Array<{
        id: string;
        name: string;
        code: string;
        previewUrl: string;
      }> = [];

      for (const row of rows) {
        const previewUrl = await createDiscoveryDownloadUrl(deps.storage, row.previewBlobPath);
        if (!previewUrl) continue;
        withUrls.push({
          id: row.id,
          name: row.displayName,
          code: row.code,
          previewUrl,
        });
      }

      return mapFlagSearchResponse(withUrls);
    },

    getDetails: async (tx: Transaction, externalId: string) => {
      const flag = await getReadyFlagDetails({ tx, id: externalId });
      if (!flag) return null;

      const variants: Array<{
        type: "rectangle" | "square" | "circle";
        url: string;
        width: number;
        height: number;
      }> = [];

      for (const variant of flag.variants) {
        const url = await createDiscoveryDownloadUrl(deps.storage, variant.blobPath);
        if (!url) return null;
        variants.push({
          type: variant.role,
          url,
          width: 0,
          height: 0,
        });
      }

      return mapFlagDetailsResponse({
        id: flag.id,
        name: flag.displayName,
        code: flag.code,
        variants,
      });
    },
  };
}

export type FlagService = ReturnType<typeof createFlagService>;
