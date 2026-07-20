import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useBreadcrumbLabel } from "@deck-pack/ui/components/composite/breadcrumb-label-context";
import { SubscriptionDetailView } from "@/features/plans/subscription-detail-view";
import { useServices } from "@/services/services-context";

export function SubscriptionDetailPanel({ subscriptionId }: { subscriptionId: string }) {
  const queryClient = useQueryClient();
  const { billing } = useServices();

  const [planId, setPlanId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [status, setStatus] = useState<"active" | "canceled">("active");

  const detailQuery = useQuery({
    queryKey: ["billing", "subscription", subscriptionId],
    queryFn: () => billing.getOrganizationSubscription(subscriptionId),
  });

  const plansQuery = useQuery({
    queryKey: ["billing", "plans"],
    queryFn: () => billing.listPlans(),
  });

  useBreadcrumbLabel(
    `/plans/subscriptions/${subscriptionId}`,
    detailQuery.data?.organizationName ??
      (detailQuery.isLoading ? "Loading…" : "Subscription"),
  );

  useEffect(() => {
    if (!detailQuery.data) {
      return;
    }
    setPlanId(detailQuery.data.planId);
    setQuantity(String(detailQuery.data.quantity));
    setStatus(detailQuery.data.status === "canceled" ? "canceled" : "active");
  }, [detailQuery.data]);

  const updateMutation = useMutation({
    mutationFn: (input: {
      planId: string;
      quantity: number;
      status: "active" | "canceled";
    }) =>
      billing.updateOrganizationSubscription({
        subscriptionId,
        ...input,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["billing", "subscription", subscriptionId],
      });
      void queryClient.invalidateQueries({ queryKey: ["billing", "subscriptions"] });
      toast.success("Subscription updated");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

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
    updateMutation.mutate({ planId, quantity: seats, status });
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
