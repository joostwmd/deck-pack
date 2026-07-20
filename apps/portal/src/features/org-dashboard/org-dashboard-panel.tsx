import { useQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";

import { OrgDashboardView } from "@/features/org-dashboard/org-dashboard-view";
import { trpc } from "@/utils/trpc";

const orgDashboardRoute = getRouteApi("/_protected/org/dashboard");

export function OrgDashboardPanel() {
  const { session, activeOrganizationId } = orgDashboardRoute.useRouteContext();
  const privateData = useQuery(trpc.privateData.queryOptions());

  if (!activeOrganizationId) {
    return null;
  }

  return (
    <OrgDashboardView
      activeOrganizationId={activeOrganizationId}
      userName={session.data?.user.name}
      apiMessage={privateData.data?.message}
    />
  );
}
