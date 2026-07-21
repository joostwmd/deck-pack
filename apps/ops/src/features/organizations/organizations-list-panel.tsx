import { useQuery } from "@tanstack/react-query";

import { OrganizationsListView } from "@/features/organizations/organizations-list-view";
import { useServices } from "@/services/services-context";

export function OrganizationsListPanel() {
  const { organization } = useServices();

  const listQuery = useQuery({
    queryKey: ["organization", "list"],
    queryFn: () => organization.listOrganizations(),
  });

  const teamOrganizations = (listQuery.data ?? []).filter((org) => org.type === "team");

  return (
    <OrganizationsListView
      loading={listQuery.isLoading}
      errorMessage={listQuery.isError ? listQuery.error.message : undefined}
      organizations={teamOrganizations}
    />
  );
}
