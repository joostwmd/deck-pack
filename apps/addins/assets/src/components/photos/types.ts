export type PhotoOrientation = "landscape" | "portrait" | "square";

export type PhotoSize = "large" | "medium" | "small";

export type PhotoNamedColor =
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "turquoise"
  | "blue"
  | "violet"
  | "pink"
  | "brown"
  | "black"
  | "gray"
  | "white";

export type PhotoLocale =
  | "en-US"
  | "pt-BR"
  | "es-ES"
  | "ca-ES"
  | "de-DE"
  | "it-IT"
  | "fr-FR"
  | "sv-SE"
  | "id-ID"
  | "pl-PL"
  | "ja-JP"
  | "zh-TW"
  | "zh-CN"
  | "ko-KR"
  | "th-TH"
  | "nl-NL"
  | "hu-HU"
  | "vi-VN"
  | "cs-CZ"
  | "da-DK"
  | "fi-FI"
  | "uk-UA"
  | "el-GR"
  | "ro-RO"
  | "nb-NO"
  | "sk-SK"
  | "tr-TR"
  | "ru-RU";

export type PhotoColor = PhotoNamedColor | `#${string}`;

export interface PhotoFilters {
  orientation?: PhotoOrientation;
  size?: PhotoSize;
  color?: PhotoColor;
  locale?: PhotoLocale;
}

export interface PhotoSearchResult {
  id: string;
  name: string;
  thumbnailUrl: string;
  insertImageUrl: string;
  width: number;
  height: number;
  avgColor: string;
  photoUrl: string;
  photographer: string;
  photographerUrl: string;
  metadata: Record<string, string>;
}

export interface PhotoSearchRequest {
  query: string;
  page: number;
  filters: PhotoFilters;
}

export interface PhotoSearchResponse {
  results: PhotoSearchResult[];
  page: number;
  perPage: number;
  totalResults: number;
  hasNextPage: boolean;
}
