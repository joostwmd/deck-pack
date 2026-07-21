import type { AssetDetailsResponse, AssetType } from "@/types/asset-types";
import type { InsertionTracker, OfficeService } from "@/services/types";
import { urlToBase64 } from "@/lib/url-to-base64";

export async function insertDirectImage({
  imageUrl,
  metadata,
  assetType,
  externalId,
  extraMetadata = {},
  office,
  tracker,
}: {
  imageUrl: string;
  metadata: Record<string, string>;
  assetType: AssetType;
  externalId: string;
  extraMetadata?: Record<string, string>;
  office: Pick<OfficeService, "insertImageWithMetadata">;
  tracker: InsertionTracker;
}) {
  const combinedMetadata = { ...metadata, ...extraMetadata };

  await tracker.track({
    assetType,
    externalId,
    client: "office",
    metadata: combinedMetadata,
  });

  const base64 = await urlToBase64(imageUrl);
  await office.insertImageWithMetadata(base64, combinedMetadata);
}

export async function insertAssetVariant(
  details: AssetDetailsResponse,
  variantId: string,
  assetType: AssetType,
  deps: {
    office: Pick<OfficeService, "insertImageWithMetadata" | "insertSvgWithMetadata">;
    tracker: InsertionTracker;
  },
  extraMetadata: Record<string, string> = {},
) {
  const variant = details.variants.find((item) => item.id === variantId);

  if (!variant) {
    throw new Error("Variant not found");
  }

  const metadata = { ...details.metadata, ...extraMetadata };

  if (variant.insert.type === "image") {
    if (!variant.insert.imageUrl) {
      throw new Error("No image URL found");
    }

    await insertDirectImage({
      imageUrl: variant.insert.imageUrl,
      metadata,
      assetType,
      externalId: details.id,
      extraMetadata: { variantId },
      office: deps.office,
      tracker: deps.tracker,
    });
    return;
  }

  if (!variant.insert.svg) {
    throw new Error("No SVG found");
  }

  await deps.tracker.track({
    assetType,
    externalId: details.id,
    client: "office",
    metadata: {
      variantId,
      ...metadata,
    },
  });

  await deps.office.insertSvgWithMetadata(variant.insert.svg, metadata);
}
