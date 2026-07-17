import type { AssetListItem } from "@/lib/asset-types";
import type { AppServices } from "@/services/types";
import { createTestServices } from "@/testing/test-services";
import {
  mockFlagDetails,
  mockIconDetails,
  mockLogoDetails,
} from "@/testing/fixtures/asset-search";

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
