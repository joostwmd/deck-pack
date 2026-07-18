import { createFileRoute } from "@tanstack/react-router";

import { OrganizationsListPanel } from "@/features/organizations/organizations-list-panel";

export const Route = createFileRoute("/_protected/organizations/")({
  component: OrganizationsListPage,
});

function OrganizationsListPage() {
  return <OrganizationsListPanel />;
}
