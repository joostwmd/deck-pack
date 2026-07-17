import type { Icon } from "@phosphor-icons/react";
import { Flag, Image, Shapes } from "@phosphor-icons/react";

import type { AssetDetailsResponse, AssetListItem, AssetType } from "@/lib/asset-types";

import {
  mockFlagDetails,
  mockFlagSearch,
  mockIconDetails,
  mockIconSearch,
  mockLogoDetails,
  mockLogoSearch,
} from "@fixtures/asset-search";

export interface AssetPickerStoryConfig {
  assetType: AssetType;
  assetLabel: string;
  headerText: string;
  searchPlaceholder: string;
  icon: Icon;
  noResultsDescription: string;
  noVariantsDescription: string;
  search: (query: string) => Promise<AssetListItem[]>;
  getDetails: (id: string) => Promise<AssetDetailsResponse>;
  getInsertionMetadata?: (details: AssetDetailsResponse, variantId: string) => Record<string, string>;
  /** Hint shown in Storybook docs */
  searchHint: string;
}

export const flagsPickerConfig: AssetPickerStoryConfig = {
  assetType: "flag",
  assetLabel: "Flag",
  headerText: "Search and insert country flags into your presentation.",
  searchPlaceholder: "Search flags...",
  icon: Flag,
  noResultsDescription: "Try searching for a different country name or code.",
  noVariantsDescription: "This flag has no variants.",
  search: mockFlagSearch,
  getDetails: mockFlagDetails,
  searchHint: 'Try searching "nether", "germany", or "france".',
};

export const logosPickerConfig: AssetPickerStoryConfig = {
  assetType: "logo",
  assetLabel: "Logo",
  headerText: "Search and insert brand logos into your presentation.",
  searchPlaceholder: "Search logos...",
  icon: Image,
  noResultsDescription: "Try searching for a different brand or company name.",
  noVariantsDescription: "This brand has no logo variants.",
  search: mockLogoSearch,
  getDetails: mockLogoDetails,
  searchHint: 'Try searching "acme" or "deck".',
};

export const iconsPickerConfig: AssetPickerStoryConfig = {
  assetType: "icon",
  assetLabel: "Icon",
  headerText: "Search and insert icons into your presentation.",
  searchPlaceholder: "Search icons...",
  icon: Shapes,
  noResultsDescription: "Try searching for a different keyword.",
  noVariantsDescription: "This icon has no style variants.",
  search: mockIconSearch,
  getDetails: mockIconDetails,
  getInsertionMetadata: (_, variantId) => ({ ICON_PLATFORM: variantId }),
  searchHint: 'Try searching "arrow" or "star".',
};

export const assetPickerConfigs = {
  flags: flagsPickerConfig,
  logos: logosPickerConfig,
  icons: iconsPickerConfig,
} as const;

export type AssetPickerConfigKey = keyof typeof assetPickerConfigs;
