import type { AssetType } from "@/lib/asset-types";
import type { InsertionTracker } from "@/services/types";
import type { TrpcClient } from "@/services/types";

export function createInsertionTracker(api: TrpcClient): InsertionTracker {
  return {
    track({ assetType, externalId, client, metadata }) {
      void api.addin.insertions.track
        .mutate({
          assetType,
          externalId,
          client,
          metadata,
        })
        .catch((error) => {
          console.error("Failed to track asset insertion:", error);
        });
    },
  };
}

/** @deprecated Use createInsertionTracker(services.api) */
export function trackAssetInsertion({
  assetType,
  externalId,
  client,
  metadata,
}: {
  assetType: AssetType;
  externalId: string;
  client: "office" | "web";
  metadata: Record<string, unknown>;
}) {
  void import("@/utils/trpc").then(({ getTrpcClient }) => {
    createInsertionTracker(getTrpcClient()).track({
      assetType,
      externalId,
      client,
      metadata,
    });
  });
}
