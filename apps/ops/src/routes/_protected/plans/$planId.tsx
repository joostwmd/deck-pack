import { createFileRoute } from "@tanstack/react-router";

import { PlanDetailPanel } from "@/features/plans/plan-detail-panel";

export const Route = createFileRoute("/_protected/plans/$planId")({
  component: PlanDetailPage,
});

function PlanDetailPage() {
  const { planId } = Route.useParams();
  return <PlanDetailPanel planId={planId} />;
}
