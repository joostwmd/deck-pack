import { Shapes } from "@phosphor-icons/react";

import { AssetSearchPanel } from "@/components/asset-picker/asset-search-panel";
import { useServices } from "@/services/services-context";

export function IconsPanel() {
  const { api } = useServices();

  return (
    <AssetSearchPanel
      assetType="icon"
      assetLabel="Icon"
      headerText="Search and insert icons into your presentation."
      searchPlaceholder="Search icons..."
      icon={Shapes}
      noResultsDescription="Try searching for a different keyword."
      noVariantsDescription="This icon has no style variants."
      search={(query) =>
        api.addin.icons.search.query({ query }).then((response) => response.results)
      }
      getDetails={(id) => api.addin.icons.getDetails.query({ externalId: id })}
      getInsertionMetadata={(_, variantId) => ({ ICON_PLATFORM: variantId })}
    />
  );
}
