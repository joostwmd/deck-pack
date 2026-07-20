import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import type { GalleryAssetClass } from "@/features/gallery/class-config";
import { GALLERY_CLASS_CONFIG } from "@/features/gallery/class-config";
import { GalleryListView } from "@/features/gallery/gallery-list-view";
import { useServices } from "@/services/services-context";

export function GalleryListPanel({ assetClass }: { assetClass: GalleryAssetClass }) {
  const { library } = useServices();
  const config = GALLERY_CLASS_CONFIG[assetClass];
  const [includeArchived, setIncludeArchived] = useState(false);

  const listQuery = useQuery({
    queryKey: ["library", assetClass, { includeArchived }],
    queryFn: () => library.list({ assetClass, includeArchived }),
  });

  return (
    <GalleryListView
      config={config}
      loading={listQuery.isLoading}
      errorMessage={listQuery.isError ? listQuery.error.message : undefined}
      items={listQuery.data ?? []}
      includeArchived={includeArchived}
      onIncludeArchivedChange={setIncludeArchived}
    />
  );
}
