import { usePlans } from "@deck-pack/hooks/billing";
import { PlansListView } from "@deck-pack/ui/components/billing/plans-list-view";

import { useServices } from "@/services/services-context";

export function PlansListPanel() {
  const { billing } = useServices();

  const listQuery = usePlans(billing);

  return (
    <PlansListView
      loading={listQuery.isLoading}
      errorMessage={listQuery.isError ? listQuery.error.message : undefined}
      plans={listQuery.data ?? []}
    />
  );
}
