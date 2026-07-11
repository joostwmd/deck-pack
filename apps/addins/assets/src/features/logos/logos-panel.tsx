import { Image } from "@phosphor-icons/react";

import { AssetSearchPanel } from "@/components/asset-picker/asset-search-panel";
import { insertAssetVariant } from "@/lib/insert-asset";
import { trpcClient } from "@/utils/trpc";
import type { AssetPanelMode } from "@/lib/asset-types";

interface LogosPanelProps {
  mode: AssetPanelMode;
}

export function LogosPanel({ mode }: LogosPanelProps) {
  return (
    <AssetSearchPanel
      mode={mode}
      assetType="logo"
      assetLabel="Logo"
      headerText="Search and insert brand logos into your presentation."
      searchPlaceholder="Search logos..."
      icon={Image}
      noResultsDescription="Try searching for a different brand or company name."
      noVariantsDescription="This brand has no logo variants."
      search={(query) =>
        trpcClient.addin.logos.search.query({ query }).then((response) => response.results)
      }
      getDetails={(id) => trpcClient.addin.logos.getDetails.query({ externalId: id })}
      onInsert={({ details, variantId }) => insertAssetVariant(details, variantId, "logo")}
    />
  );
}
