import type { insertAssetInsertion } from "@deck-pack/db/queries/insertAssetInsertion";
import type { assertInsertAllowed } from "@deck-pack/db/queries/usage-entitlements";
import type { Transaction } from "@deck-pack/db/transaction";

import { serviceFail, serviceOk, type ServiceResult } from "../../trpc/service-result";

export type AddinServiceDeps = {
  insertAssetInsertion: typeof insertAssetInsertion;
  assertInsertAllowed: typeof assertInsertAllowed;
};

export function createAddinService(deps: AddinServiceDeps) {
  const { insertAssetInsertion, assertInsertAllowed } = deps;

  return {
    trackInsertion: async (
      tx: Transaction,
      input: {
        organizationId: string;
        userId: string;
        assetType: Parameters<typeof insertAssetInsertion>[0]["input"]["assetType"];
        externalId: string;
        client: "office" | "web";
        metadata: Record<string, unknown>;
      },
    ): Promise<ServiceResult<{ id: string }>> => {
      const allowed = await assertInsertAllowed({
        tx,
        organizationId: input.organizationId,
        assetType: input.assetType,
      });

      if (!allowed.ok) {
        if (allowed.reason === "quota_exceeded") {
          return serviceFail("invalid_state", {
            message: `Monthly insert limit reached for ${allowed.assetType}. Upgrade your plan to continue.`,
            details: { code: "quota_exceeded", assetType: allowed.assetType },
          });
        }

        return serviceFail("invalid_state", {
          message: "No active subscription for this workspace",
          details: { code: "no_subscription" },
        });
      }

      const row = await insertAssetInsertion({
        tx,
        input: {
          organizationId: input.organizationId,
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
