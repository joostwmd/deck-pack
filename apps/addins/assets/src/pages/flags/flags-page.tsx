import { Flag } from "@phosphor-icons/react";

import { AssetSearchPanel } from "@/components/asset-browser/asset-search-panel";
import { useServices } from "@/services/services-context";

export function FlagsPage() {
  const { assets } = useServices();

  return (
    <AssetSearchPanel
      assetType="flag"
      assetLabel="Flag"
      headerText="Search and insert country flags into your presentation."
      searchPlaceholder="Search flags..."
      icon={Flag}
      noResultsDescription="Try searching for a different country name or code."
      noVariantsDescription="This flag has no variants."
      search={(query) => assets.flags.search(query)}
      getDetails={(id) => assets.flags.getDetails(id)}
    />
  );
}
