import type { AssetType } from "@/lib/asset-types";
import { trpcClient } from "@/utils/trpc";

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
  void trpcClient.addin.insertions.track
    .mutate({
      assetType,
      externalId,
      client,
      metadata,
    })
    .catch((error) => {
      console.error("Failed to track asset insertion:", error);
    });
}
