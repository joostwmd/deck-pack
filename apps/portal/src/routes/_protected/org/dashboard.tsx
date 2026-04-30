import { createFileRoute } from "@tanstack/react-router";

import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/_protected/org/dashboard")({
  component: OrgDashboardPage,
});

function OrgDashboardPage() {
  const { session, activeOrganizationId } = Route.useRouteContext();

  const privateData = useQuery(trpc.privateData.queryOptions());

  return (
    <div className="space-y-2">
      <h1 className="text-xl font-semibold">Org dashboard</h1>
      <p className="text-muted-foreground">Organization: {activeOrganizationId}</p>
      <p>Welcome {session.data?.user.name}</p>
      {privateData.data && <p className="text-sm">API: {privateData.data.message}</p>}
    </div>
  );
}
