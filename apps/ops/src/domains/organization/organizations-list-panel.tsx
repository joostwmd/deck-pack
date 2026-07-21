import { useOrganizations } from "@deck-pack/hooks/organization";
import { OrganizationsListView } from "@deck-pack/ui/components/organization/organizations-list-view";

import { useServices } from "@/services/services-context";

export function OrganizationsListPanel() {
  const { organization } = useServices();

  const listQuery = useOrganizations(organization);

  const teamOrganizations = (listQuery.data ?? []).filter((org) => org.type === "team");

  return (
    <OrganizationsListView
      loading={listQuery.isLoading}
      errorMessage={listQuery.isError ? listQuery.error.message : undefined}
      organizations={teamOrganizations}
    />
  );
}
