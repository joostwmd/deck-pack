import { createFileRoute } from "@tanstack/react-router";

import { OrganizationsListPanel } from "@/domains/organization/organizations-list-panel";

export const Route = createFileRoute("/_protected/organizations/")({
  component: OrganizationsListPage,
});

function OrganizationsListPage() {
  return <OrganizationsListPanel />;
}
