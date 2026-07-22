import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { BillingStore, CreateOrganizationSubscriptionInput } from "./billing-store";
import { billingKeys } from "./query-keys";

export function useCreateOrganizationSubscription(billing: BillingStore) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateOrganizationSubscriptionInput) =>
      billing.createOrganizationSubscription(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: billingKeys.subscriptions() });
    },
  });
}
