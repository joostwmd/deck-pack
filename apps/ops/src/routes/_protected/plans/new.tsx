import { createFileRoute } from "@tanstack/react-router";

import { NewPlanPanel } from "@/features/plans/new-plan-panel";

export const Route = createFileRoute("/_protected/plans/new")({
  component: NewPlanPage,
});

function NewPlanPage() {
  return <NewPlanPanel />;
}
