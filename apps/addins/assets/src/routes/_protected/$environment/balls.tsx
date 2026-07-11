import { createFileRoute } from "@tanstack/react-router";

import { HarveyBallsPanel } from "@/features/harvey-balls/harvey-balls-panel";
import { toAssetPanelMode } from "@/lib/route-environment";

export const Route = createFileRoute("/_protected/$environment/balls")({
  component: BallsPage,
});

function BallsPage() {
  const { environment } = Route.useParams();

  return <HarveyBallsPanel mode={toAssetPanelMode(environment)} />;
}
