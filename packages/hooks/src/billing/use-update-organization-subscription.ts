import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { BillingStore, UpdateOrganizationSubscriptionInput } from "./billing-store";
import { billingKeys } from "./query-keys";

export function useUpdateOrganizationSubscription(billing: BillingStore) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateOrganizationSubscriptionInput) =>
      billing.updateOrganizationSubscription(input),
    onSuccess: (subscription) => {
      void queryClient.invalidateQueries({
        queryKey: billingKeys.subscription(subscription.id),
      });
      void queryClient.invalidateQueries({ queryKey: billingKeys.subscriptions() });
    },
  });
}
