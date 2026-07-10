import { Shapes } from "@phosphor-icons/react";

import { AssetSearchPanel } from "@/components/asset-picker/asset-search-panel";
import { addinApi } from "@/lib/api";
import type { AssetPanelMode, AssetSearchResponse } from "@/lib/asset-types";
import { insertAssetVariant } from "@/lib/insert-asset";

interface IconsPanelProps {
  mode: AssetPanelMode;
}

export function IconsPanel({ mode }: IconsPanelProps) {
  return (
    <AssetSearchPanel
      mode={mode}
      assetLabel="Icon"
      headerText="Search and insert icons into your presentation."
      searchPlaceholder="Search icons..."
      icon={Shapes}
      noResultsDescription="Try searching for a different keyword."
      noVariantsDescription="This icon has no style variants."
      search={(query) => addinApi.searchIcons(query).then((r: AssetSearchResponse) => r.results)}
      getDetails={(id) => addinApi.getIconDetails(id)}
      onInsert={({ details, variantId }) =>
        insertAssetVariant(details, variantId, { ICON_PLATFORM: variantId })
      }
    />
  );
}
