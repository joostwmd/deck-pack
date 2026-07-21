import { getReadyFlagDetails, searchReadyFlags } from "@deck-pack/db/queries/libraryDiscovery";
import type { Transaction } from "@deck-pack/db/transaction";
import type { ObjectStorage } from "@deck-pack/storage";

import { createDiscoveryDownloadUrl } from "@deck-pack/gallery";

import { mapFlagDetailsResponse, mapFlagSearchResponse } from "./mappers";
import type { FlagSearchResult } from "./types";

export type FlagServiceDeps = {
  storage: ObjectStorage;
};

export function createFlagService(deps: FlagServiceDeps) {
  return {
    search: async (
      tx: Transaction,
      input: { query: string; organizationId?: string | null; internalOnly?: boolean },
    ) => {
      const rows = await searchReadyFlags({
        tx,
        query: input.query,
        organizationId: input.organizationId,
        internalOnly: input.internalOnly,
      });
      const withUrls: FlagSearchResult[] = [];

      for (const row of rows) {
        const previewUrl = await createDiscoveryDownloadUrl(deps.storage, row.previewBlobPath);
        if (!previewUrl) continue;
        withUrls.push({
          id: row.id,
          name: row.displayName,
          code: row.code,
          previewUrl,
          scope: row.scope,
        });
      }

      return mapFlagSearchResponse(withUrls);
    },

    getDetails: async (tx: Transaction, externalId: string, organizationId?: string | null) => {
      const flag = await getReadyFlagDetails({ tx, id: externalId, organizationId });
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
