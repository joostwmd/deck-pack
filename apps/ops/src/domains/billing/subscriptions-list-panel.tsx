import { useOrganizationSubscriptions } from "@deck-pack/hooks/billing";
import { SubscriptionsListView } from "@deck-pack/ui/components/billing/subscriptions-list-view";

import { useServices } from "@/services/services-context";

export function SubscriptionsListPanel() {
  const { billing } = useServices();

  const listQuery = useOrganizationSubscriptions(billing);

  return (
    <SubscriptionsListView
      loading={listQuery.isLoading}
      errorMessage={listQuery.isError ? listQuery.error.message : undefined}
      subscriptions={listQuery.data ?? []}
    />
  );
}
