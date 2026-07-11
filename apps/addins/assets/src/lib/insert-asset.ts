import { officeClient } from "@deck-pack/office-js";

import type { AssetDetailsResponse, AssetType } from "@/lib/asset-types";
import { trackAssetInsertion } from "@/lib/track-asset-insertion";
import { urlToBase64 } from "@/lib/url-to-base64";

export async function insertAssetVariant(
  details: AssetDetailsResponse,
  variantId: string,
  assetType: AssetType,
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

    const base64 = await urlToBase64(variant.insert.imageUrl);
    await officeClient.insertImageWithMetadata(base64, metadata);
  } else {
    if (!variant.insert.svg) {
      throw new Error("No SVG found");
    }

    await officeClient.insertSvgWithMetadata(variant.insert.svg, metadata);
  }

  trackAssetInsertion({
    assetType,
    externalId: details.id,
    client: "office",
    metadata: {
      variantId,
      ...metadata,
    },
  });
}
