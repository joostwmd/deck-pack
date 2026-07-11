import { createFileRoute } from "@tanstack/react-router";

import { CheckPanel } from "@/features/check/check-panel";
import { toAssetPanelMode } from "@/lib/route-environment";

export const Route = createFileRoute("/_protected/$environment/check")({
  component: CheckPage,
});

function CheckPage() {
  const { environment } = Route.useParams();

  return <CheckPanel mode={toAssetPanelMode(environment)} />;
}
