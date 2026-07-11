import { Flag } from "@phosphor-icons/react";

import { AssetSearchPanel } from "@/components/asset-picker/asset-search-panel";
import { insertAssetVariant } from "@/lib/insert-asset";
import { trpcClient } from "@/utils/trpc";
import type { AssetPanelMode } from "@/lib/asset-types";

interface FlagsPanelProps {
  mode: AssetPanelMode;
}

export function FlagsPanel({ mode }: FlagsPanelProps) {
  return (
    <AssetSearchPanel
      mode={mode}
      assetType="flag"
      assetLabel="Flag"
      headerText="Search and insert country flags into your presentation."
      searchPlaceholder="Search flags..."
      icon={Flag}
      noResultsDescription="Try searching for a different country name or code."
      noVariantsDescription="This flag has no variants."
      search={(query) =>
        trpcClient.addin.flags.search.query({ query }).then((response) => response.results)
      }
      getDetails={(id) => trpcClient.addin.flags.getDetails.query({ externalId: id })}
      onInsert={({ details, variantId }) => insertAssetVariant(details, variantId, "flag")}
    />
  );
}
