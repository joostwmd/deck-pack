import { useQuery } from "@tanstack/react-query";

import type { OrganizationStore } from "./organization-store";
import { organizationKeys } from "./query-keys";

export function useLookupUser(organization: OrganizationStore, email: string | null) {
  return useQuery({
    queryKey: organizationKeys.lookupUser(email),
    queryFn: () => organization.lookupUser(email ?? ""),
    enabled: email !== null && email.length > 0,
  });
}
