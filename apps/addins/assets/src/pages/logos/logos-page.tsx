import { Image } from "@phosphor-icons/react";

import { AssetSearchPanel } from "@/components/asset-browser/asset-search-panel";
import { useServices } from "@/services/services-context";

export function LogosPage() {
  const { assets } = useServices();

  return (
    <AssetSearchPanel
      assetType="logo"
      assetLabel="Logo"
      headerText="Search and insert brand logos into your presentation."
      searchPlaceholder="Search logos..."
      icon={Image}
      noResultsDescription="Try searching for a different brand or company name."
      noVariantsDescription="This brand has no logo variants."
      search={(query) => assets.logos.search(query)}
      getDetails={(id) => assets.logos.getDetails(id)}
    />
  );
}
