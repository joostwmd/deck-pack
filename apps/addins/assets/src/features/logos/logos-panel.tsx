import { Image } from "@phosphor-icons/react";

import { AssetSearchPanel } from "@/components/asset-picker/asset-search-panel";
import { useServices } from "@/services/services-context";

export function LogosPanel() {
  const { api } = useServices();

  return (
    <AssetSearchPanel
      assetType="logo"
      assetLabel="Logo"
      headerText="Search and insert brand logos into your presentation."
      searchPlaceholder="Search logos..."
      icon={Image}
      noResultsDescription="Try searching for a different brand or company name."
      noVariantsDescription="This brand has no logo variants."
      search={(query) =>
        api.addin.logos.search.query({ query }).then((response) => response.results)
      }
      getDetails={(id) => api.addin.logos.getDetails.query({ externalId: id })}
    />
  );
}
