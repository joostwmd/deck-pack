import { createFileRoute } from "@tanstack/react-router";

import { HarveyBallsPage } from "@/pages/harvey-balls/harvey-balls-page";

export const Route = createFileRoute("/_protected/$environment/harvey-balls")({
  component: HarveyBallsPage,
});
