import { createFileRoute } from "@tanstack/react-router";

import { PlanDetailPanel } from "@/domains/billing/plan-detail-panel";

export const Route = createFileRoute("/_protected/plans/$planId")({
  component: PlanDetailPage,
});

function PlanDetailPage() {
  const { planId } = Route.useParams();
  return <PlanDetailPanel planId={planId} />;
}
