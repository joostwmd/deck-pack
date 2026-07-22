import type {
  DiscoveryAssetDetailsResponse,
  DiscoveryAssetSearchResponse,
} from "../domain/discovery";

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export type FlagSearchResultWithUrl = {
  id: string;
  name: string;
  code: string;
  previewUrl: string;
  scope: "global" | "org";
};

export type FlagDetailsWithUrls = {
  id: string;
  name: string;
  code: string;
  variants: Array<{
    type: "rectangle" | "square" | "circle";
    url: string;
    width: number;
    height: number;
  }>;
};

export function mapFlagSearchResponse(
  flags: FlagSearchResultWithUrl[],
): DiscoveryAssetSearchResponse {
  return {
    results: flags.map((flag) => ({
      id: flag.id,
      imageUrl: flag.previewUrl,
      name: flag.name,
      scope: flag.scope,
    })),
  };
}

export function mapFlagDetailsResponse(flag: FlagDetailsWithUrls): DiscoveryAssetDetailsResponse {
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
