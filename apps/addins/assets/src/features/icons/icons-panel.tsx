import { Shapes } from "@phosphor-icons/react";

import { AssetSearchPanel } from "@/components/asset-picker/asset-search-panel";
import { insertAssetVariant } from "@/lib/insert-asset";
import { trpcClient } from "@/utils/trpc";
import type { AssetPanelMode } from "@/lib/asset-types";

interface IconsPanelProps {
  mode: AssetPanelMode;
}

export function IconsPanel({ mode }: IconsPanelProps) {
  return (
    <AssetSearchPanel
      mode={mode}
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
      onInsert={({ details, variantId }) =>
        insertAssetVariant(details, variantId, "icon", { ICON_PLATFORM: variantId })
      }
    />
  );
}
