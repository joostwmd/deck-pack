export interface ShapeSearchResult {
  id: string;
  name: string;
  category: string;
  thumbnailUrl: string;
  svgUrl: string;
  createdAt: string;
  scope: "global" | "org";
}

export interface ShapeSearchFacets {
  categories: string[];
}

export interface ShapeSearchRequest {
  category?: string;
  internalOnly?: boolean;
}

export interface ShapeSearchResponse {
  results: ShapeSearchResult[];
  total: number;
  facets: ShapeSearchFacets;
}
