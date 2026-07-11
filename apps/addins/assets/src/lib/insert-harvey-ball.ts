import { officeClient } from "@deck-pack/office-js";

import type { AssetPanelMode } from "@/lib/asset-types";
import {
  createHarveyBallMetadata,
  serializeHarveyBallSvg,
  type HarveyBallConfig,
} from "@/lib/harvey-ball-svg";
import { trackAssetInsertion } from "@/lib/track-asset-insertion";

export const HARVEY_BALL_EXTERNAL_ID = "harvey-ball";

interface InsertHarveyBallOptions {
  mode: AssetPanelMode;
  config: HarveyBallConfig;
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

export async function insertHarveyBall({
  mode,
  config,
  webCanvas,
}: InsertHarveyBallOptions) {
  const svg = serializeHarveyBallSvg(config);
  const metadata = createHarveyBallMetadata(config);

  if (mode === "web") {
    if (!webCanvas) {
      throw new Error("Canvas not available");
    }

    webCanvas.addToCanvas({
      variantId: `harvey-ball-${config.percentage}`,
      name: `Harvey ball ${config.percentage}%`,
      imageUrl: "",
      insert: { type: "svg", svg },
      metadata,
    });

    trackAssetInsertion({
      assetType: "harvey_ball",
      externalId: HARVEY_BALL_EXTERNAL_ID,
      client: "web",
      metadata,
    });

    return;
  }

  await officeClient.insertSvgWithMetadata(svg, metadata);

  trackAssetInsertion({
    assetType: "harvey_ball",
    externalId: HARVEY_BALL_EXTERNAL_ID,
    client: "office",
    metadata,
  });
}
