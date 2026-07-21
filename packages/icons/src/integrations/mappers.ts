import type {
  NounProjectIconDetails,
  NounProjectSearchResponse,
} from "@deck-pack/integrations/noun-project";

import type { IconDetailsResponse, IconSearchResponse } from "../domain/icon";

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function mapIconSearchResponse(response: NounProjectSearchResponse): IconSearchResponse {
  return {
    results: response.icons.map((icon) => ({
      id: icon.id,
      imageUrl: icon.thumbnail_url ?? "",
      name: icon.term?.trim() || icon.id,
    })),
  };
}

export function mapIconDetailsResponse(response: NounProjectIconDetails): IconDetailsResponse {
  const variants = response.variants
    .filter((variant) => variant.previewUrl || variant.svg)
    .map((variant) => {
      const imageUrl = variant.previewUrl || "";
      if (variant.svg) {
        return {
          id: variant.id,
          imageUrl,
          name: capitalize(variant.name),
          insert: {
            type: "svg" as const,
            svg: variant.svg,
          },
        };
      }

      // Free-tier Noun Project responses often only include PNG thumbnails.
      return {
        id: variant.id,
        imageUrl,
        name: capitalize(variant.name),
        insert: {
          type: "image" as const,
          imageUrl,
        },
      };
    });

  return {
    id: response.id,
    name: response.name,
    imageUrl: response.thumbnailUrl || variants[0]?.imageUrl || "",
    variants,
    metadata: {
      TYPE: "icon",
      ICON_ID: response.id,
      ICON_NAME: response.name,
      ATTRIBUTION: response.attribution ?? "",
      PROVIDER: "noun-project",
    },
  };
}
