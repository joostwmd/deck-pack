export type SlideAspectRatio = "16:9" | "4:3";

export type SlideSort = "relevance" | "newest" | "name";

export interface SlideFilters {
  category?: string;
  tags?: string[];
  aspectRatio?: SlideAspectRatio;
  internalOnly?: boolean;
}

export interface SlideSearchResult {
  id: string;
  name: string;
  thumbnailUrl: string;
  presentationUrl: string;
  category: string;
  tags: string[];
  aspectRatio: SlideAspectRatio;
  createdAt: string;
  scope: "global" | "org";
}

export interface SlideSearchFacets {
  categories: string[];
  tags: string[];
  aspectRatios: SlideAspectRatio[];
}

export interface SlideSearchRequest {
  query?: string;
  filters: SlideFilters;
  sort: SlideSort;
}

export interface SlideSearchResponse {
  results: SlideSearchResult[];
  total: number;
  facets: SlideSearchFacets;
}
