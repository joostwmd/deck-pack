import type {
  BrandfetchDetailsResponse,
  BrandfetchLogo,
  BrandfetchLogoFormat,
  BrandfetchSearchResponse,
} from "@deck-pack/integrations/brandfetch";

import type { AssetDetailsResponse, AssetSearchResponse } from "../assets/types";
import { capitalize } from "../../utils/strings";

const FORMAT_PREFERENCE = ["svg", "png", "webp", "jpeg"] as const;

function pickBestFormat(formats: BrandfetchLogoFormat[]): BrandfetchLogoFormat | undefined {
  for (const preferred of FORMAT_PREFERENCE) {
    const match = formats.find((format) => format.format === preferred);
    if (match) return match;
  }
  return formats[0];
}

function logoImageUrl(logo: BrandfetchLogo): string {
  return pickBestFormat(logo.formats)?.src ?? "";
}

function variantName(logo: BrandfetchLogo): string {
  const typeLabel = capitalize(logo.type);
  if (logo.theme) {
    return `${typeLabel} - ${capitalize(logo.theme)}`;
  }
  return typeLabel;
}

export function mapLogoSearchResponse(response: BrandfetchSearchResponse): AssetSearchResponse {
  return {
    results: response.results.map((brand) => ({
      // Domain is the preferred Brand API identifier for getDetails.
      id: brand.domain,
      imageUrl: brand.icon ?? "",
      name: brand.name?.trim() || brand.domain,
    })),
  };
}

export function mapLogoDetailsResponse(response: BrandfetchDetailsResponse): AssetDetailsResponse {
  const variants = (response.logos ?? [])
    .map((logo, index) => {
      const imageUrl = logoImageUrl(logo);
      if (!imageUrl) return null;
      return {
        id: `${logo.type}-${logo.theme ?? "default"}-${index}`,
        imageUrl,
        name: variantName(logo),
        insert: {
          type: "image" as const,
          imageUrl,
        },
      };
    })
    .filter((variant): variant is NonNullable<typeof variant> => variant != null);

  return {
    id: response.domain || response.brandId,
    name: response.name?.trim() || response.domain,
    imageUrl: variants[0]?.imageUrl ?? "",
    variants,
    metadata: {
      TYPE: "logo",
      BRAND_ID: response.brandId,
      BRAND_NAME: response.name?.trim() || response.domain,
      BRAND_DOMAIN: response.domain,
      STOCK_TICKERS: "",
    },
  };
}
