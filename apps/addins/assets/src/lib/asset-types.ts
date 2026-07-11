export interface AssetListItem {
  id: string;
  imageUrl: string;
  name: string;
}

export interface AssetInsertPayload {
  type: "image" | "svg";
  imageUrl?: string;
  svg?: string;
}

export interface AssetVariantItem extends AssetListItem {
  insert: AssetInsertPayload;
}

export interface AssetSearchResponse {
  results: AssetListItem[];
}

export interface AssetDetailsResponse {
  id: string;
  name: string;
  imageUrl: string;
  variants: AssetVariantItem[];
  metadata: Record<string, string>;
}

export interface SelectedAssetEntity {
  id: string;
  name: string;
  icon: string;
}

export type AssetPanelMode = "office" | "web";

export type AssetTab = "logos" | "flags" | "icons" | "harvey-balls";

export type AssetType = "logo" | "flag" | "icon" | "harvey_ball";
