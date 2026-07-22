import { createFileRoute } from "@tanstack/react-router";

import { SoloHomePanel } from "@/pages/solo-home/solo-home-panel";

export const Route = createFileRoute("/_protected/solo/home")({
  component: SoloHomePanel,
});
