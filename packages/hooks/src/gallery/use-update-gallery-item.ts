import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { GalleryAssetClass } from "@deck-pack/db/gallery-catalog";

import type { GalleryStore, UpdateGalleryItemInput } from "./gallery-store";
import { galleryKeys } from "./query-keys";

export function useUpdateGalleryItem(gallery: GalleryStore, assetClass: GalleryAssetClass) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateGalleryItemInput) => gallery.update(input),
    onSuccess: (detail) => {
      void queryClient.setQueryData(galleryKeys.detail(detail.id), detail);
      void queryClient.invalidateQueries({ queryKey: galleryKeys.list(assetClass, false) });
      void queryClient.invalidateQueries({ queryKey: galleryKeys.list(assetClass, true) });
    },
  });
}

export function useUnpublishGalleryItem(gallery: GalleryStore, assetClass: GalleryAssetClass) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string }) => gallery.unpublish(input),
    onSuccess: (detail) => {
      void queryClient.setQueryData(galleryKeys.detail(detail.id), detail);
      void queryClient.invalidateQueries({ queryKey: galleryKeys.list(assetClass, false) });
      void queryClient.invalidateQueries({ queryKey: galleryKeys.list(assetClass, true) });
    },
  });
}
