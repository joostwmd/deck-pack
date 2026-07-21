import { getRouteApi } from "@tanstack/react-router";

import { OrgDashboardView } from "@/features/org-dashboard/org-dashboard-view";

const orgDashboardRoute = getRouteApi("/_protected/org/dashboard");

export function OrgDashboardPanel() {
  const { session, activeOrganizationId } = orgDashboardRoute.useRouteContext();

  if (!activeOrganizationId) {
    return null;
  }

  return (
    <OrgDashboardView
      activeOrganizationId={activeOrganizationId}
      userName={session.data?.user.name}
    />
  );
}
