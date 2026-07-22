import { useQuery } from "@tanstack/react-query";

import type { BillingStore } from "./billing-store";
import { billingKeys } from "./query-keys";

export function usePlan(billing: BillingStore, planId: string) {
  return useQuery({
    queryKey: billingKeys.plan(planId),
    queryFn: () => billing.getPlan(planId),
    enabled: Boolean(planId),
  });
}
