export interface ShapeSearchResult {
  id: string;
  name: string;
  category: string;
  thumbnailUrl: string;
  svgUrl: string;
  createdAt: string;
}

export interface ShapeSearchFacets {
  categories: string[];
}

export interface ShapeSearchRequest {
  category?: string;
}

export interface ShapeSearchResponse {
  results: ShapeSearchResult[];
  total: number;
  facets: ShapeSearchFacets;
}
