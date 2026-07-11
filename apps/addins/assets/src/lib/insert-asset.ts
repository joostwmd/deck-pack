import { officeClient } from "@deck-pack/office-js";

import type { AssetDetailsResponse, AssetType } from "@/lib/asset-types";
import { trackAssetInsertion } from "@/lib/track-asset-insertion";
import { urlToBase64 } from "@/lib/url-to-base64";

export async function insertDirectImage({
  imageUrl,
  metadata,
  assetType,
  externalId,
  extraMetadata = {},
}: {
  imageUrl: string;
  metadata: Record<string, string>;
  assetType: AssetType;
  externalId: string;
  extraMetadata?: Record<string, string>;
}) {
  const combinedMetadata = { ...metadata, ...extraMetadata };
  const base64 = await urlToBase64(imageUrl);
  await officeClient.insertImageWithMetadata(base64, combinedMetadata);

  trackAssetInsertion({
    assetType,
    externalId,
    client: "office",
    metadata: combinedMetadata,
  });
}

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

    await insertDirectImage({
      imageUrl: variant.insert.imageUrl,
      metadata,
      assetType,
      externalId: details.id,
      extraMetadata: { variantId },
    });
    return;
  }

  if (!variant.insert.svg) {
    throw new Error("No SVG found");
  }

  await officeClient.insertSvgWithMetadata(variant.insert.svg, metadata);

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
