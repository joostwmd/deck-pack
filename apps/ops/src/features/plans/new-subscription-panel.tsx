import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { NewSubscriptionView } from "@/features/plans/new-subscription-view";
import { useServices } from "@/services/services-context";

export function NewSubscriptionPanel() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { billing, organization } = useServices();

  const [organizationId, setOrganizationId] = useState("");
  const [planId, setPlanId] = useState("");
  const [quantity, setQuantity] = useState("1");

  const orgsQuery = useQuery({
    queryKey: ["organization", "list"],
    queryFn: () => organization.listOrganizations(),
  });

  const plansQuery = useQuery({
    queryKey: ["billing", "plans"],
    queryFn: () => billing.listPlans(),
  });

  const createMutation = useMutation({
    mutationFn: (input: { organizationId: string; planId: string; quantity: number }) =>
      billing.createOrganizationSubscription(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["billing", "subscriptions"] });
      toast.success("Subscription created");
      void navigate({ to: "/plans/subscriptions" });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const seats = Number.parseInt(quantity, 10);
    if (!organizationId || !planId || !Number.isFinite(seats) || seats < 1) {
      toast.error("Select an organization, plan, and a positive seat count");
      return;
    }
    createMutation.mutate({
      organizationId,
      planId,
      quantity: seats,
    });
  };

  const optionsError =
    orgsQuery.isError || plansQuery.isError
      ? (orgsQuery.error?.message ?? plansQuery.error?.message)
      : undefined;

  return (
    <NewSubscriptionView
      organizations={orgsQuery.data ?? []}
      plans={plansQuery.data ?? []}
      organizationId={organizationId}
      onOrganizationIdChange={setOrganizationId}
      planId={planId}
      onPlanIdChange={setPlanId}
      quantity={quantity}
      onQuantityChange={setQuantity}
      loadingOptions={orgsQuery.isLoading || plansQuery.isLoading}
      optionsError={optionsError}
      submitting={createMutation.isPending}
      onSubmit={handleSubmit}
    />
  );
}
