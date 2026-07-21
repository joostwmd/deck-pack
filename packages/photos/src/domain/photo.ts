export type PhotoSearchInput = {
  query: string;
  orientation?: "landscape" | "portrait" | "square";
  size?: "large" | "medium" | "small";
  color?: string;
  locale?: string;
  page?: number;
  perPage?: number;
};

export type PhotoSearchResult = {
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
};

export type PhotoSearchResponse = {
  results: PhotoSearchResult[];
  page: number;
  perPage: number;
  totalResults: number;
  hasNextPage: boolean;
};
