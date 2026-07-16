import { Flag } from "@phosphor-icons/react";

import { AssetSearchPanel } from "@/components/asset-picker/asset-search-panel";
import { useServices } from "@/services/services-context";

export function FlagsPanel() {
  const { api } = useServices();

  return (
    <AssetSearchPanel
      assetType="flag"
      assetLabel="Flag"
      headerText="Search and insert country flags into your presentation."
      searchPlaceholder="Search flags..."
      icon={Flag}
      noResultsDescription="Try searching for a different country name or code."
      noVariantsDescription="This flag has no variants."
      search={(query) =>
        api.addin.flags.search.query({ query }).then((response) => response.results)
      }
      getDetails={(id) => api.addin.flags.getDetails.query({ externalId: id })}
    />
  );
}
