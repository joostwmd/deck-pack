import { PhotoSearchPanel } from "@/features/photos/photo-search-panel";
import type { AssetPanelMode } from "@/lib/asset-types";
import { trpcClient } from "@/utils/trpc";

interface PhotosPanelProps {
  mode: AssetPanelMode;
}

export function PhotosPanel({ mode }: PhotosPanelProps) {
  return (
    <PhotoSearchPanel
      mode={mode}
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
