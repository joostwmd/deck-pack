import { createFileRoute } from "@tanstack/react-router";

import { IconsPanel } from "@/features/icons/icons-panel";
import { toAssetPanelMode } from "@/lib/route-environment";

export const Route = createFileRoute("/_protected/$environment/icons")({
  component: IconsPage,
});

function IconsPage() {
  const { environment } = Route.useParams();

  return <IconsPanel mode={toAssetPanelMode(environment)} />;
}
