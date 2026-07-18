import { Shapes } from "@phosphor-icons/react";

import { AssetSearchPanel } from "@/components/asset-browser/asset-search-panel";
import { useServices } from "@/services/services-context";

export function IconsPage() {
  const { assets } = useServices();

  return (
    <AssetSearchPanel
      assetType="icon"
      assetLabel="Icon"
      headerText="Search and insert icons into your presentation."
      searchPlaceholder="Search icons..."
      icon={Shapes}
      noResultsDescription="Try searching for a different keyword."
      noVariantsDescription="This icon has no style variants."
      search={(query) => assets.icons.search(query)}
      getDetails={(id) => assets.icons.getDetails(id)}
      getInsertionMetadata={(_, variantId) => ({ ICON_PLATFORM: variantId })}
    />
  );
}
