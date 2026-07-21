export type {
  CreateGalleryItemInput,
  FlagVariantRole,
  GalleryAssetClass,
  GalleryFileRef,
  GalleryItemDetail,
  GalleryItemStatus,
  GalleryListItem,
  GalleryListItemWithPreview,
  GalleryScope,
  GalleryUploadRole,
  ShapeCategory,
  SlideAspectRatio,
  SlideCategory,
  UpdateGalleryItemMetadataInput,
} from "./domain/gallery-item";
export {
  FLAG_VARIANT_ROLES,
  GALLERY_ASSET_CLASSES,
  GALLERY_ITEM_STATUSES,
  GALLERY_UPLOAD_ROLES,
  SHAPE_CATEGORIES,
  SLIDE_ASPECT_RATIOS,
  SLIDE_CATEGORIES,
  assertMutable,
  checkPublishable,
} from "./domain/gallery-item";

export type {
  DiscoveryAssetDetailsResponse,
  DiscoveryAssetSearchResponse,
  GetReadyFlagDetailsInput,
  ReadyFlagDetailsRow,
  ReadyFlagSearchRow,
  ReadyShapeRow,
  ReadySlideRow,
  SearchReadyFlagsInput,
  SearchReadyShapesInput,
  SearchReadySlidesInput,
  ShapeSearchResponse,
  ShapeSearchResult,
  SlideDiscoverySort,
  SlideSearchResponse,
  SlideSearchResult,
} from "./domain/discovery";
export { FlagNotFoundError } from "./domain/errors";

export type { GalleryRepository } from "./repositories/gallery-repository";
export { DrizzleGalleryRepository } from "./repositories/gallery-repository";
export {
  InMemoryGalleryRepository,
  type InMemoryDiscoverySeed,
  type InMemoryGallerySeed,
} from "./repositories/in-memory-gallery-repository";

export { ListGalleryItems } from "./use-cases/list-gallery-items";
export { GetGalleryItem } from "./use-cases/get-gallery-item";
export { CreateGalleryItem } from "./use-cases/create-gallery-item";
export { UpdateGalleryItem } from "./use-cases/update-gallery-item";
export { PublishGalleryItem } from "./use-cases/publish-gallery-item";
export { UnpublishGalleryItem } from "./use-cases/unpublish-gallery-item";
export { ArchiveGalleryItem } from "./use-cases/archive-gallery-item";
export { CreateGalleryUploadTarget } from "./use-cases/create-gallery-upload-target";
export { FinalizeGalleryUpload } from "./use-cases/finalize-gallery-upload";
export { PutAndFinalizeGalleryUpload } from "./use-cases/put-and-finalize-gallery-upload";
export { SearchReadyFlags } from "./use-cases/search-ready-flags";
export { GetReadyFlagDetails } from "./use-cases/get-ready-flag-details";
export { SearchReadyShapes } from "./use-cases/search-ready-shapes";
export { SearchReadySlides } from "./use-cases/search-ready-slides";

export { createDiscoveryDownloadUrl, mapWithSignedUrls } from "./signed-urls";
export { uploadTargetForClient } from "./upload-target-for-client";

export {
  shapeSearchInputSchema,
  shapeSearchResponseSchema,
  slideAspectRatioSchema,
  slideSearchInputSchema,
  slideSearchResponseSchema,
  slideSortSchema,
} from "./schemas";
