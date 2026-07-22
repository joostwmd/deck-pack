import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { BillingStore, CreatePlanInput } from "./billing-store";
import { billingKeys } from "./query-keys";

export function useCreatePlan(billing: BillingStore) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePlanInput) => billing.createPlan(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: billingKeys.plans() });
    },
  });
}
