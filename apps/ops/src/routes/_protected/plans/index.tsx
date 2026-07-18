import { createFileRoute } from "@tanstack/react-router";

import { PlansPage } from "@/features/plans/plans-page";

export const Route = createFileRoute("/_protected/plans/")({
  component: PlansPage,
});
