import type { WebCanvasContextValue } from "@/contexts/web-canvas-context";
import type { AssetInsertPayload, AssetType } from "@/types/asset-types";
import type { InsertionTracker, OfficeService } from "@/services/types";
import { urlToBase64 } from "@/utils/url-to-base64";

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

async function reserveInsertion(
  item: InsertionItem,
  tracker: InsertionTracker,
  client: "office" | "web",
): Promise<void> {
  await tracker.track({
    assetType: item.assetType,
    externalId: item.externalId,
    client,
    metadata: item.metadata,
  });
}

async function insertOfficeItem(
  item: InsertionItem,
  office: Pick<OfficeService, "insertImageWithMetadata" | "insertSvgWithMetadata">,
  tracker: InsertionTracker,
): Promise<void> {
  // Reserve quota on the server before mutating the deck so over-limit
  // inserts fail with a toast instead of inserting silently.
  await reserveInsertion(item, tracker, "office");

  if (item.insert.type === "image") {
    if (!item.insert.imageUrl) {
      throw new Error("No image URL found");
    }

    const base64 = await urlToBase64(item.insert.imageUrl);
    await office.insertImageWithMetadata(base64, item.metadata);
    return;
  }

  if (!item.insert.svg) {
    throw new Error("No SVG found");
  }

  await office.insertSvgWithMetadata(item.insert.svg, item.metadata);
}

export function officeInsertionStrategyWithTracker(
  office: Pick<OfficeService, "insertImageWithMetadata" | "insertSvgWithMetadata">,
  tracker: InsertionTracker,
): InsertionStrategy {
  return {
    verb: "Insert",
    insertingVerb: "Inserting...",
    insert: (item) => insertOfficeItem(item, office, tracker),
  };
}

export function createCanvasStrategy(
  webCanvas: WebCanvasContextValue,
  tracker: InsertionTracker,
): InsertionStrategy {
  return {
    verb: "Add to canvas",
    insertingVerb: "Adding...",
    async insert(item) {
      await reserveInsertion(item, tracker, "web");

      webCanvas.addToCanvas({
        variantId: item.variantId,
        name: item.name,
        imageUrl: item.imageUrl,
        insert: item.insert,
        metadata: item.metadata,
      });
    },
  };
}
