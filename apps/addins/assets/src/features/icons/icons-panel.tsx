import { Shapes } from "@phosphor-icons/react";

import { AssetSearchPanel } from "@/components/asset-picker/asset-search-panel";
import { trpcClient } from "@/utils/trpc";

export function IconsPanel() {
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
        trpcClient.addin.icons.search.query({ query }).then((response) => response.results)
      }
      getDetails={(id) => trpcClient.addin.icons.getDetails.query({ externalId: id })}
      getInsertionMetadata={(_, variantId) => ({ ICON_PLATFORM: variantId })}
    />
  );
}
