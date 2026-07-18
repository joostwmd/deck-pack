import type { IconDetailsResponse, IconSearchResponse } from "@deck-pack/integrations/icons8";

import type { AssetDetailsResponse, AssetSearchResponse } from "../assets/types";
import { capitalize } from "../../lib/strings";

export function mapIconSearchResponse(response: IconSearchResponse): AssetSearchResponse {
  return {
    results: response.icons.map((icon) => ({
      id: icon.id,
      imageUrl: icon.previewUrl,
      name: icon.name,
    })),
  };
}

export function mapIconDetailsResponse(response: IconDetailsResponse): AssetDetailsResponse {
  const variants = response.variants.map((variant) => ({
    id: variant.platform,
    imageUrl: variant.previewUrl,
    name: capitalize(variant.platform),
    insert: {
      type: "svg" as const,
      svg: variant.svg,
    },
  }));

  return {
    id: response.id,
    name: response.name,
    imageUrl: variants[0]?.imageUrl ?? "",
    variants,
    metadata: {
      TYPE: "icon",
      ICON_ID: response.id,
      ICON_NAME: response.name,
    },
  };
}
