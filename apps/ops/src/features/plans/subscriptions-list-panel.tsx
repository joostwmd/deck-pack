import { useQuery } from "@tanstack/react-query";

import { SubscriptionsListView } from "@/features/plans/subscriptions-list-view";
import { useServices } from "@/services/services-context";

export function SubscriptionsListPanel() {
  const { billing } = useServices();

  const listQuery = useQuery({
    queryKey: ["billing", "subscriptions"],
    queryFn: () => billing.listOrganizationSubscriptions(),
  });

  return (
    <SubscriptionsListView
      loading={listQuery.isLoading}
      errorMessage={listQuery.isError ? listQuery.error.message : undefined}
      subscriptions={listQuery.data ?? []}
    />
  );
}
