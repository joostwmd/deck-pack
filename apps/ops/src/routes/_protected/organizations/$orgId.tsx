import { createFileRoute } from "@tanstack/react-router";

import { OrganizationDetailPanel } from "@/features/organizations/organization-detail-panel";

export const Route = createFileRoute("/_protected/organizations/$orgId")({
  component: OrganizationDetailPage,
});

function OrganizationDetailPage() {
  const { orgId } = Route.useParams();
  return <OrganizationDetailPanel orgId={orgId} />;
}
