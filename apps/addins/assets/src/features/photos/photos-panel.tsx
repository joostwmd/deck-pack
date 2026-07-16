import { PhotoSearchPanel } from "@/features/photos/photo-search-panel";
import { useServices } from "@/services/services-context";

export function PhotosPanel() {
  const { api } = useServices();

  return (
    <PhotoSearchPanel
      search={({ query, page, filters }) =>
        api.addin.photos.search.query({
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
