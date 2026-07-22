import type { AssetType } from "@/types/asset-types";
import type { InsertionStore } from "@/services/types";

export function createInsertionTracker(insertions: InsertionStore) {
  return {
    track: (input: {
      assetType: AssetType;
      externalId: string;
      client: "office" | "web";
      metadata: Record<string, unknown>;
    }) => insertions.track(input),
  };
}
