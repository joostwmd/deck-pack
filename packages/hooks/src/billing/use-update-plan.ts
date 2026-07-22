import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { BillingStore, UpdatePlanInput } from "./billing-store";
import { billingKeys } from "./query-keys";

export function useUpdatePlan(billing: BillingStore) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdatePlanInput) => billing.updatePlan(input),
    onSuccess: (plan) => {
      void queryClient.invalidateQueries({ queryKey: billingKeys.plan(plan.id) });
      void queryClient.invalidateQueries({ queryKey: billingKeys.plans() });
    },
  });
}
