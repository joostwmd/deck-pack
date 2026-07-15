export interface IconSearchItem {
  id: string;
  name: string;
  commonName: string;
  category: string;
  platform: string;
  isFree: boolean;
  previewUrl: string;
}

export interface IconVariant {
  platform: string;
  previewUrl: string;
  svg: string;
  isFree: boolean;
}

export interface IconSearchResponse {
  success: boolean;
  icons: IconSearchItem[];
}

export interface IconDetailsResponse {
  success: boolean;
  id: string;
  name: string;
  category: string;
  variants: IconVariant[];
}

export interface SearchIconsInput {
  term: string;
  amount?: number;
}

export interface GetIconByIdInput {
  id: string;
  language?: string;
}
