import { useQuery } from "@tanstack/react-query";

import type { BillingStore } from "./billing-store";
import { billingKeys } from "./query-keys";

export function useOrganizationSubscription(billing: BillingStore, subscriptionId: string) {
  return useQuery({
    queryKey: billingKeys.subscription(subscriptionId),
    queryFn: () => billing.getOrganizationSubscription(subscriptionId),
    enabled: Boolean(subscriptionId),
  });
}
