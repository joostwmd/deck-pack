import type {
  FlagVariantRole,
  ShapeCategory,
  SlideAspectRatio,
  SlideCategory,
} from "./gallery-item";

export type ReadyShapeRow = {
  id: string;
  displayName: string;
  category: ShapeCategory;
  scope: "global" | "org";
  createdAt: Date;
  updatedAt: Date;
  svgBlobPath: string;
  svgContentType: string;
};

export type ReadySlideRow = {
  id: string;
  displayName: string;
  category: SlideCategory;
  aspectRatio: SlideAspectRatio;
  scope: "global" | "org";
  createdAt: Date;
  updatedAt: Date;
  thumbnailBlobPath: string;
  presentationBlobPath: string;
  aliases: string[];
};

export type SlideDiscoverySort = "relevance" | "newest" | "name";

export type ReadyFlagSearchRow = {
  id: string;
  displayName: string;
  code: string;
  scope: "global" | "org";
  previewBlobPath: string;
};

export type ReadyFlagDetailsRow = {
  id: string;
  displayName: string;
  code: string;
  variants: Array<{
    role: FlagVariantRole;
    blobPath: string;
    contentType: string;
  }>;
};

export type SearchReadyFlagsInput = {
  query: string;
  organizationId?: string | null;
  internalOnly?: boolean;
};

export type GetReadyFlagDetailsInput = {
  id: string;
  organizationId?: string | null;
};

export type SearchReadyShapesInput = {
  category?: ShapeCategory;
  organizationId?: string | null;
  internalOnly?: boolean;
};

export type SearchReadySlidesInput = {
  query?: string;
  category?: SlideCategory;
  tags?: string[];
  aspectRatio?: SlideAspectRatio;
  sort?: SlideDiscoverySort;
  organizationId?: string | null;
  internalOnly?: boolean;
};

/** Add-in asset search DTO (shared shape with logos/icons). */
export type DiscoveryAssetSearchResponse = {
  results: Array<{
    id: string;
    imageUrl: string;
    name: string;
    scope?: "global" | "org";
  }>;
};

export type DiscoveryAssetDetailsResponse = {
  id: string;
  name: string;
  imageUrl: string;
  variants: Array<{
    id: string;
    imageUrl: string;
    name: string;
    insert: { type: "image" | "svg"; imageUrl?: string; svg?: string };
  }>;
  metadata: Record<string, string>;
};

export type ShapeSearchResult = {
  id: string;
  name: string;
  category: ShapeCategory;
  scope: "global" | "org";
  thumbnailUrl: string;
  svgUrl: string;
  createdAt: string;
};

export type ShapeSearchResponse = {
  results: ShapeSearchResult[];
  total: number;
  facets: { categories: ShapeCategory[] };
};

export type SlideSearchResult = {
  id: string;
  name: string;
  thumbnailUrl: string;
  presentationUrl: string;
  category: SlideCategory;
  tags: string[];
  aspectRatio: SlideAspectRatio;
  scope: "global" | "org";
  createdAt: string;
};

export type SlideSearchResponse = {
  results: SlideSearchResult[];
  total: number;
  facets: {
    categories: SlideCategory[];
    tags: string[];
    aspectRatios: SlideAspectRatio[];
  };
};
