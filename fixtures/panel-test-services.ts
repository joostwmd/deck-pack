import type { AssetListItem } from "@/types/asset-types";
import type { AppServices } from "@/services/types";

import {
  mockFlagDetails,
  mockIconDetails,
  mockLogoDetails,
} from "@fixtures/asset-search";
import { createTestServices } from "@fixtures/test-services";

function withAssetSearch(
  base: AppServices,
  asset: "flags" | "logos" | "icons",
  search: (query: string) => Promise<AssetListItem[]>,
): AppServices {
  const getDetails =
    asset === "flags" ? mockFlagDetails : asset === "logos" ? mockLogoDetails : mockIconDetails;

  return {
    ...base,
    assets: {
      ...base.assets,
      [asset]: {
        search,
        getDetails,
      },
    },
  };
}

export function createFlagsTestServices(
  search: (query: string) => Promise<AssetListItem[]>,
): AppServices {
  return withAssetSearch(createTestServices(), "flags", search);
}

export function createLogosTestServices(
  search: (query: string) => Promise<AssetListItem[]>,
): AppServices {
  return withAssetSearch(createTestServices(), "logos", search);
}

export function createIconsTestServices(
  search: (query: string) => Promise<AssetListItem[]>,
): AppServices {
  return withAssetSearch(createTestServices(), "icons", search);
}
