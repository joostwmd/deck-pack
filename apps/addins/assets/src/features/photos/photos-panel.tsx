import { PhotoSearchPanel } from "@/features/photos/photo-search-panel";
import { trpcClient } from "@/utils/trpc";

export function PhotosPanel() {
  return (
    <PhotoSearchPanel
      search={({ query, page, filters }) =>
        trpcClient.addin.photos.search.query({
          query,
          page,
          orientation: filters.orientation,
          size: filters.size,
          color: filters.color,
          locale: filters.locale,
        })
      }
    />
  );
}
