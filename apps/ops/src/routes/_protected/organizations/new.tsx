import { createFileRoute } from "@tanstack/react-router";

import { NewOrganizationPanel } from "@/features/organizations/new-organization-panel";

export const Route = createFileRoute("/_protected/organizations/new")({
  component: NewOrganizationPage,
});

function NewOrganizationPage() {
  return <NewOrganizationPanel />;
}
