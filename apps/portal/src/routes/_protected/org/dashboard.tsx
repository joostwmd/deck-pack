import { createFileRoute } from "@tanstack/react-router";

import { OrgDashboardPanel } from "@/features/org-dashboard/org-dashboard-panel";

export const Route = createFileRoute("/_protected/org/dashboard")({
  component: OrgDashboardPanel,
});
