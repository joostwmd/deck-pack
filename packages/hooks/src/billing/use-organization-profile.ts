import { useQuery } from "@tanstack/react-query";

import type { OrganizationProfileStore } from "./organization-profile-store";
import { billingKeys } from "./query-keys";

export function useOrganizationProfile(billing: OrganizationProfileStore) {
  return useQuery({
    queryKey: billingKeys.profile(),
    queryFn: () => billing.getOrganizationProfile(),
  });
}
