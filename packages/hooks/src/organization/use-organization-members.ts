import { useQuery } from "@tanstack/react-query";

import type { OrganizationStore } from "./organization-store";
import { organizationKeys } from "./query-keys";

export function useOrganizationMembers(organization: OrganizationStore, organizationId: string) {
  return useQuery({
    queryKey: organizationKeys.members(organizationId),
    queryFn: () => organization.listMembers(organizationId),
    enabled: Boolean(organizationId),
  });
}
