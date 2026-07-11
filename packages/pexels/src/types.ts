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

export interface SearchPhotosInput {
  query: string;
  orientation?: PhotoOrientation;
  size?: PhotoSize;
  color?: PhotoNamedColor | `#${string}`;
  locale?: PhotoLocale;
  page?: number;
  perPage?: number;
}

export interface PexelsPhotoSrc {
  original: string;
  large2x: string;
  large: string;
  medium: string;
  small: string;
  portrait: string;
  landscape: string;
  tiny: string;
}

export interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  photographer_id: number;
  avg_color: string;
  src: PexelsPhotoSrc;
  alt: string;
}

export interface PexelsSearchResponse {
  page: number;
  per_page: number;
  total_results: number;
  next_page?: string;
  prev_page?: string;
  photos: PexelsPhoto[];
}

export interface PexelsRateLimitInfo {
  limit: number | null;
  remaining: number | null;
  reset: number | null;
}
