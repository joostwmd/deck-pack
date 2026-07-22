import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { GalleryAssetClass } from "@deck-pack/db/gallery-catalog";

import type { GalleryStore } from "./gallery-store";
import { galleryKeys } from "./query-keys";

export function usePublishGalleryItem(gallery: GalleryStore, assetClass: GalleryAssetClass) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string }) => gallery.publish(input),
    onSuccess: (detail) => {
      void queryClient.setQueryData(galleryKeys.detail(detail.id), detail);
      void queryClient.invalidateQueries({ queryKey: galleryKeys.list(assetClass, false) });
      void queryClient.invalidateQueries({ queryKey: galleryKeys.list(assetClass, true) });
    },
  });
}
