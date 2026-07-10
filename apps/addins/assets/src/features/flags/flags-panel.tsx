import { Flag } from "@phosphor-icons/react";

import { AssetSearchPanel } from "@/components/asset-picker/asset-search-panel";
import { addinApi } from "@/lib/api";
import type { AssetPanelMode, AssetSearchResponse } from "@/lib/asset-types";
import { insertAssetVariant } from "@/lib/insert-asset";

interface FlagsPanelProps {
  mode: AssetPanelMode;
}

export function FlagsPanel({ mode }: FlagsPanelProps) {
  return (
    <AssetSearchPanel
      mode={mode}
      assetLabel="Flag"
      headerText="Search and insert country flags into your presentation."
      searchPlaceholder="Search flags..."
      icon={Flag}
      noResultsDescription="Try searching for a different country name or code."
      noVariantsDescription="This flag has no variants."
      search={(query) => addinApi.searchFlags(query).then((r: AssetSearchResponse) => r.results)}
      getDetails={(id) => addinApi.getFlagDetails(id)}
      onInsert={({ details, variantId }) => insertAssetVariant(details, variantId)}
    />
  );
}
