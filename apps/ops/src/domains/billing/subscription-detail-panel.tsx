import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  useOrganizationSubscription,
  usePlans,
  useUpdateOrganizationSubscription,
} from "@deck-pack/hooks/billing";
import { useBreadcrumbLabel } from "@deck-pack/ui/components/composite/breadcrumb-label-context";
import { SubscriptionDetailView } from "@deck-pack/ui/components/billing/subscription-detail-view";

import { useServices } from "@/services/services-context";

export function SubscriptionDetailPanel({ subscriptionId }: { subscriptionId: string }) {
  const { billing } = useServices();

  const [planId, setPlanId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [status, setStatus] = useState<"active" | "canceled">("active");

  const detailQuery = useOrganizationSubscription(billing, subscriptionId);
  const plansQuery = usePlans(billing);

  useBreadcrumbLabel(
    `/plans/subscriptions/${subscriptionId}`,
    detailQuery.data?.organizationName ?? (detailQuery.isLoading ? "Loading…" : "Subscription"),
  );

  useEffect(() => {
    if (!detailQuery.data) {
      return;
    }
    setPlanId(detailQuery.data.planId);
    setQuantity(String(detailQuery.data.quantity));
    setStatus(detailQuery.data.status === "canceled" ? "canceled" : "active");
  }, [detailQuery.data]);

  const updateMutation = useUpdateOrganizationSubscription(billing);

  const dirty =
    Boolean(detailQuery.data) &&
    (planId !== detailQuery.data?.planId ||
      quantity !== String(detailQuery.data?.quantity) ||
      status !== (detailQuery.data?.status === "canceled" ? "canceled" : "active"));

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const seats = Number.parseInt(quantity, 10);
    if (!planId || !Number.isFinite(seats) || seats < 1) {
      toast.error("Select a plan and a positive seat count");
      return;
    }
    updateMutation.mutate(
      { subscriptionId, planId, quantity: seats, status },
      {
        onSuccess: () => toast.success("Subscription updated"),
        onError: (error: Error) => toast.error(error.message),
      },
    );
  };

  return (
    <SubscriptionDetailView
      loading={detailQuery.isLoading}
      errorMessage={detailQuery.isError ? detailQuery.error.message : undefined}
      subscription={detailQuery.data}
      plans={plansQuery.data ?? []}
      plansLoading={plansQuery.isLoading}
      planId={planId}
      onPlanIdChange={setPlanId}
      quantity={quantity}
      onQuantityChange={setQuantity}
      status={status}
      onStatusChange={setStatus}
      saving={updateMutation.isPending}
      dirty={dirty}
      onSubmit={handleSubmit}
    />
  );
}
