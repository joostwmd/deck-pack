import { useQuery } from "@tanstack/react-query";

import type { OrganizationStore } from "./organization-store";
import { organizationKeys } from "./query-keys";

export function useOrganizations(organization: OrganizationStore) {
  return useQuery({
    queryKey: organizationKeys.list(),
    queryFn: () => organization.listOrganizations(),
  });
}
