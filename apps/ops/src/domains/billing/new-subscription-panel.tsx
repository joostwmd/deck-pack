import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { useCreateOrganizationSubscription, usePlans } from "@deck-pack/hooks/billing";
import { useOrganizations } from "@deck-pack/hooks/organization";
import { NewSubscriptionView } from "@deck-pack/ui/components/billing/new-subscription-view";

import { useServices } from "@/services/services-context";

export function NewSubscriptionPanel() {
  const navigate = useNavigate();
  const { billing, organization } = useServices();

  const [organizationId, setOrganizationId] = useState("");
  const [planId, setPlanId] = useState("");
  const [quantity, setQuantity] = useState("1");

  const orgsQuery = useOrganizations(organization);
  const plansQuery = usePlans(billing);

  const createMutation = useCreateOrganizationSubscription(billing);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const seats = Number.parseInt(quantity, 10);
    if (!organizationId || !planId || !Number.isFinite(seats) || seats < 1) {
      toast.error("Select an organization, plan, and a positive seat count");
      return;
    }
    createMutation.mutate(
      { organizationId, planId, quantity: seats },
      {
        onSuccess: () => {
          toast.success("Subscription created");
          void navigate({ to: "/plans/subscriptions" });
        },
        onError: (error: Error) => toast.error(error.message),
      },
    );
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
