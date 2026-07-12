import { createFileRoute } from "@tanstack/react-router";

import { HarveyBallsPanel } from "@/features/harvey-balls/harvey-balls-panel";

export const Route = createFileRoute("/_protected/$environment/balls")({
  component: BallsPage,
});

function BallsPage() {
  return <HarveyBallsPanel />;
}
