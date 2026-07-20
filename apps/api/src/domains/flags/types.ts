export interface FlagSearchResult {
  id: string;
  name: string;
  code: string;
  previewUrl: string;
}

export interface FlagVariant {
  type: "rectangle" | "square" | "circle";
  url: string;
  width: number;
  height: number;
}

export interface FlagDetailsResponse {
  id: string;
  name: string;
  code: string;
  variants: FlagVariant[];
}
