import { useState } from "react";

import { useGalleryItems } from "@deck-pack/hooks/gallery";
import { GalleryListView } from "@deck-pack/ui/components/gallery/gallery-list-view";

import type { GalleryAssetClass } from "@/domains/gallery/class-config";
import { GALLERY_CLASS_CONFIG } from "@/domains/gallery/class-config";
import { useServices } from "@/services/services-context";

export function GalleryListPanel({ assetClass }: { assetClass: GalleryAssetClass }) {
  const { gallery } = useServices();
  const config = GALLERY_CLASS_CONFIG[assetClass];
  const [includeArchived, setIncludeArchived] = useState(false);

  const listQuery = useGalleryItems(gallery, { assetClass, includeArchived });

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
