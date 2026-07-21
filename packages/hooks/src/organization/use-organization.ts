import { useQuery } from "@tanstack/react-query";

import type { OrganizationStore } from "./organization-store";
import { organizationKeys } from "./query-keys";

export function useOrganization(organization: OrganizationStore, organizationId: string) {
  return useQuery({
    queryKey: organizationKeys.detail(organizationId),
    queryFn: () => organization.getOrganization(organizationId),
    enabled: Boolean(organizationId),
  });
}
