import type { insertAssetInsertion } from "@deck-pack/db/queries/insertAssetInsertion";
import type { Transaction } from "@deck-pack/db/transaction";

import { serviceFail, serviceOk, type ServiceResult } from "../../api/resilience/service-result";

export type AddinServiceDeps = {
  insertAssetInsertion: typeof insertAssetInsertion;
};

export function createAddinService(deps: AddinServiceDeps) {
  const { insertAssetInsertion } = deps;

  return {
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

export type AddinService = ReturnType<typeof createAddinService>;

/** @deprecated Use AddinService */
export type AddinAssetService = AddinService;

/** @deprecated Use createAddinService */
export const createAddinAssetService = createAddinService;
