import { officeClient } from "@deck-pack/office-js";

import type { ShapeSearchResult } from "@/features/shapes/types";
import type { AssetPanelMode } from "@/lib/asset-types";
import { trackAssetInsertion } from "@/lib/track-asset-insertion";

function buildShapeMetadata(shape: ShapeSearchResult): Record<string, string> {
  return {
    SHAPE_ID: shape.id,
    CATEGORY: shape.category,
    TYPE: "SHAPE",
  };
}

async function fetchSvgText(svgUrl: string): Promise<string> {
  const response = await fetch(svgUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch shape SVG (${response.status})`);
  }

  return response.text();
}

interface InsertShapeOptions {
  mode: AssetPanelMode;
  shape: ShapeSearchResult;
  webCanvas?: {
    addToCanvas: (item: {
      variantId: string;
      name: string;
      imageUrl: string;
      insert: { type: "svg"; svg: string };
      metadata: Record<string, string>;
    }) => void;
  } | null;
}

export async function insertShape({ mode, shape, webCanvas }: InsertShapeOptions) {
  const svg = await fetchSvgText(shape.svgUrl);
  const metadata = buildShapeMetadata(shape);

  if (mode === "web") {
    if (!webCanvas) {
      throw new Error("Canvas not available");
    }

    webCanvas.addToCanvas({
      variantId: shape.id,
      name: shape.name,
      imageUrl: shape.thumbnailUrl,
      insert: { type: "svg", svg },
      metadata,
    });

    trackAssetInsertion({
      assetType: "shape",
      externalId: shape.id,
      client: "web",
      metadata,
    });

    return;
  }

  await officeClient.insertSvgWithMetadata(svg, metadata);

  trackAssetInsertion({
    assetType: "shape",
    externalId: shape.id,
    client: "office",
    metadata,
  });
}
