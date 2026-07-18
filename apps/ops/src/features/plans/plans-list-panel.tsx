import { useQuery } from "@tanstack/react-query";

import { PlansListView } from "@/features/plans/plans-list-view";
import { useServices } from "@/services/services-context";

export function PlansListPanel() {
  const { billing } = useServices();

  const listQuery = useQuery({
    queryKey: ["billing", "plans"],
    queryFn: () => billing.listPlans(),
  });

  return (
    <PlansListView
      loading={listQuery.isLoading}
      errorMessage={listQuery.isError ? listQuery.error.message : undefined}
      plans={listQuery.data ?? []}
    />
  );
}
