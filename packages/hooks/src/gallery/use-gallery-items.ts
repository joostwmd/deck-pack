import { useQuery } from "@tanstack/react-query";
import type { GalleryAssetClass } from "@deck-pack/db/gallery-catalog";

import type { GalleryStore } from "./gallery-store";
import { galleryKeys } from "./query-keys";

export function useGalleryItems(
  gallery: GalleryStore,
  input: { assetClass: GalleryAssetClass; includeArchived?: boolean },
) {
  const includeArchived = input.includeArchived ?? false;
  return useQuery({
    queryKey: galleryKeys.list(input.assetClass, includeArchived),
    queryFn: () => gallery.list({ assetClass: input.assetClass, includeArchived }),
  });
}
