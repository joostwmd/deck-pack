import { useQuery } from "@tanstack/react-query";

import type { GalleryStore } from "./gallery-store";
import { galleryKeys } from "./query-keys";

export function useGalleryItem(gallery: GalleryStore, id: string) {
  return useQuery({
    queryKey: galleryKeys.detail(id),
    queryFn: () => gallery.get({ id }),
    enabled: Boolean(id),
  });
}
