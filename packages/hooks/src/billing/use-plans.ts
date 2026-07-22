import { useQuery } from "@tanstack/react-query";

import type { BillingStore } from "./billing-store";
import { billingKeys } from "./query-keys";

export function usePlans(billing: BillingStore) {
  return useQuery({
    queryKey: billingKeys.plans(),
    queryFn: () => billing.listPlans(),
  });
}
