import { createFileRoute } from "@tanstack/react-router";

import { PlansListPanel } from "@/domains/billing/plans-list-panel";

export const Route = createFileRoute("/_protected/plans/")({
  component: PlansListPage,
});

function PlansListPage() {
  return <PlansListPanel />;
}
