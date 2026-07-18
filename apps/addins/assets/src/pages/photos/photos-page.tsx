import { PhotoSearchPanel } from "@/components/photos/photo-search-panel";
import { useServices } from "@/services/services-context";

export function PhotosPage() {
  const { assets } = useServices();

  return (
    <PhotoSearchPanel
      search={({ query, page, filters }) =>
        assets.photos.search({
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
