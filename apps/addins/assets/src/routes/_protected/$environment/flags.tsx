import { createFileRoute } from "@tanstack/react-router";

import { FlagsPanel } from "@/features/flags/flags-panel";
import { toAssetPanelMode } from "@/lib/route-environment";

export const Route = createFileRoute("/_protected/$environment/flags")({
  component: FlagsPage,
});

function FlagsPage() {
  const { environment } = Route.useParams();

  return <FlagsPanel mode={toAssetPanelMode(environment)} />;
}
