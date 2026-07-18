import { useQuery } from "@tanstack/react-query";

import { OrganizationsListView } from "@/features/organizations/organizations-list-view";
import { useServices } from "@/services/services-context";

export function OrganizationsListPanel() {
  const { organization } = useServices();

  const listQuery = useQuery({
    queryKey: ["organization", "list"],
    queryFn: () => organization.listOrganizations(),
  });

  return (
    <OrganizationsListView
      loading={listQuery.isLoading}
      errorMessage={listQuery.isError ? listQuery.error.message : undefined}
      organizations={listQuery.data ?? []}
    />
  );
}
