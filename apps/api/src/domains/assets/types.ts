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
