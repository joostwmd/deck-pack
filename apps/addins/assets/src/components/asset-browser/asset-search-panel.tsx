import { AssetSearchPanelView } from "./asset-search-panel-view";
import {
  useAssetSearchPanelController,
  type AssetSearchPanelProps,
} from "@/hooks/asset-browser/use-asset-search-panel-controller";

export type { AssetSearchPanelProps };

export function AssetSearchPanel(props: AssetSearchPanelProps) {
  const viewProps = useAssetSearchPanelController(props);
  return <AssetSearchPanelView {...viewProps} />;
}
