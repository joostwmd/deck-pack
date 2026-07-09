import { ImageIcon } from "lucide-react";

import { AssetSearchPanel } from "@/components/asset-picker/asset-search-panel";
import { addinApi } from "@/lib/api";
import type { AssetPanelMode, AssetSearchResponse } from "@/lib/asset-types";
import { insertAssetVariant } from "@/lib/insert-asset";

interface LogosPanelProps {
  mode: AssetPanelMode;
}

export function LogosPanel({ mode }: LogosPanelProps) {
  return (
    <AssetSearchPanel
      mode={mode}
      assetLabel="Logo"
      headerText="Search and insert brand logos into your presentation."
      searchPlaceholder="Search logos..."
      icon={ImageIcon}
      noResultsDescription="Try searching for a different brand or company name."
      noVariantsDescription="This brand has no logo variants."
      search={(query) => addinApi.searchLogos(query).then((r: AssetSearchResponse) => r.results)}
      getDetails={(id) => addinApi.getLogoDetails(id)}
      onInsert={({ details, variantId }) => insertAssetVariant(details, variantId)}
    />
  );
}
