import type { AssetDetailsResponse, AssetSearchResponse } from "../assets/types";
import { capitalize } from "../../lib/strings";

import type { FlagDetailsResponse, FlagSearchResult } from "./types";

export function mapFlagSearchResponse(flags: FlagSearchResult[]): AssetSearchResponse {
  return {
    results: flags.map((flag) => ({
      id: flag.id,
      imageUrl: flag.previewUrl,
      name: flag.name,
    })),
  };
}

export function mapFlagDetailsResponse(flag: FlagDetailsResponse): AssetDetailsResponse {
  const variants = flag.variants.map((variant) => ({
    id: variant.type,
    imageUrl: variant.url,
    name: capitalize(variant.type),
    insert: {
      type: "image" as const,
      imageUrl: variant.url,
    },
  }));

  return {
    id: flag.id,
    name: flag.name,
    imageUrl: flag.variants[0]?.url ?? "",
    variants,
    metadata: {
      TYPE: "flag",
      FLAG_ID: flag.id,
      FLAG_NAME: flag.name,
      FLAG_CODE: flag.code,
    },
  };
}
