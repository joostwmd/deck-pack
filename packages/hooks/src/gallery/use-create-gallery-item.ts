import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { CreateGalleryItemInput, GalleryStore } from "./gallery-store";
import { galleryKeys } from "./query-keys";

export function useCreateGalleryItem(gallery: GalleryStore) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateGalleryItemInput) => gallery.create(input),
    onSuccess: (_result, input) => {
      void queryClient.invalidateQueries({
        queryKey: galleryKeys.list(input.assetClass, false),
      });
      void queryClient.invalidateQueries({
        queryKey: galleryKeys.list(input.assetClass, true),
      });
    },
  });
}
