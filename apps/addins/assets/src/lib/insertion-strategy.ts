import { officeClient } from "@deck-pack/office-js";

import type { WebCanvasContextValue } from "@/contexts/web-canvas-context";
import type { AssetInsertPayload, AssetType } from "@/lib/asset-types";
import type { InsertionTracker } from "@/services/types";
import { urlToBase64 } from "@/lib/url-to-base64";

export interface InsertionItem {
  variantId: string;
  name: string;
  imageUrl: string;
  insert: AssetInsertPayload;
  metadata: Record<string, string>;
  assetType: AssetType;
  externalId: string;
}

export interface InsertionStrategy {
  verb: string;
  insertingVerb: string;
  insert: (item: InsertionItem) => Promise<void>;
}

async function insertOfficeItem(item: InsertionItem, tracker: InsertionTracker): Promise<void> {
  if (item.insert.type === "image") {
    if (!item.insert.imageUrl) {
      throw new Error("No image URL found");
    }

    const base64 = await urlToBase64(item.insert.imageUrl);
    await officeClient.insertImageWithMetadata(base64, item.metadata);

    tracker.track({
      assetType: item.assetType,
      externalId: item.externalId,
      client: "office",
      metadata: item.metadata,
    });
    return;
  }

  if (!item.insert.svg) {
    throw new Error("No SVG found");
  }

  await officeClient.insertSvgWithMetadata(item.insert.svg, item.metadata);

  tracker.track({
    assetType: item.assetType,
    externalId: item.externalId,
    client: "office",
    metadata: item.metadata,
  });
}

export function officeInsertionStrategyWithTracker(tracker: InsertionTracker): InsertionStrategy {
  return {
    verb: "Insert",
    insertingVerb: "Inserting...",
    insert: (item) => insertOfficeItem(item, tracker),
  };
}

/** @deprecated Use officeInsertionStrategyWithTracker via services.insertion */
export const officeInsertionStrategy: InsertionStrategy = {
  verb: "Insert",
  insertingVerb: "Inserting...",
  insert: async (item) => {
    const { createInsertionTracker } = await import("@/lib/track-asset-insertion");
    const { getTrpcClient } = await import("@/utils/trpc");
    return insertOfficeItem(item, createInsertionTracker(getTrpcClient()));
  },
};

export function createCanvasStrategy(
  webCanvas: WebCanvasContextValue,
  tracker: InsertionTracker,
): InsertionStrategy {
  return {
    verb: "Add to canvas",
    insertingVerb: "Adding...",
    async insert(item) {
      webCanvas.addToCanvas({
        variantId: item.variantId,
        name: item.name,
        imageUrl: item.imageUrl,
        insert: item.insert,
        metadata: item.metadata,
      });

      tracker.track({
        assetType: item.assetType,
        externalId: item.externalId,
        client: "web",
        metadata: item.metadata,
      });
    },
  };
}
