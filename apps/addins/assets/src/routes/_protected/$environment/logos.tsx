import { createFileRoute } from "@tanstack/react-router";

import { LogosPanel } from "@/features/logos/logos-panel";
import { toAssetPanelMode } from "@/lib/route-environment";

export const Route = createFileRoute("/_protected/$environment/logos")({
  component: LogosPage,
});

function LogosPage() {
  const { environment } = Route.useParams();

  return <LogosPanel mode={toAssetPanelMode(environment)} />;
}
