import { useQuery } from "@tanstack/react-query";

import type { BillingStore } from "./billing-store";
import { billingKeys } from "./query-keys";

export function useOrganizationSubscriptions(billing: BillingStore) {
  return useQuery({
    queryKey: billingKeys.subscriptions(),
    queryFn: () => billing.listOrganizationSubscriptions(),
  });
}
