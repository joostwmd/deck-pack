import type { BrandfetchDetailsResponse, BrandfetchSearchResponse } from "@deck-pack/integrations/brandfetch";

import type { AssetDetailsResponse, AssetSearchResponse } from "../assets/types";
import { capitalize } from "../../lib/strings";

export function mapLogoSearchResponse(response: BrandfetchSearchResponse): AssetSearchResponse {
  return {
    results: response.results.map((brand) => ({
      id: brand.brandId || brand.id,
      imageUrl: brand.logo || "",
      name: brand.name || brand.domain,
    })),
  };
}

export function mapLogoDetailsResponse(response: BrandfetchDetailsResponse): AssetDetailsResponse {
  const variants = (response.logos ?? []).map((logo, index) => ({
    id: `${index}`,
    imageUrl: logo.formats?.[0]?.src ?? "",
    name: `${capitalize(logo.type)} - ${capitalize(logo.theme)}`,
    insert: {
      type: "image" as const,
      imageUrl: logo.formats?.[0]?.src ?? "",
    },
  }));

  return {
    id: response.brandId,
    name: response.name,
    imageUrl: variants[0]?.imageUrl ?? "",
    variants,
    metadata: {
      TYPE: "logo",
      BRAND_ID: response.brandId,
      BRAND_NAME: response.name,
      STOCK_TICKERS: "",
    },
  };
}
