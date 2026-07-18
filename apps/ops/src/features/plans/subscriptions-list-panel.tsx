import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { SubscriptionsListView } from "@/features/plans/subscriptions-list-view";
import { useServices } from "@/services/services-context";
import type { OrganizationSubscription } from "@/services/types";

export function SubscriptionsListPanel() {
  const { billing } = useServices();
  const queryClient = useQueryClient();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState("");

  const listQuery = useQuery({
    queryKey: ["billing", "subscriptions"],
    queryFn: () => billing.listOrganizationSubscriptions(),
  });

  const updateMutation = useMutation({
    mutationFn: (input: { subscriptionId: string; quantity: number }) =>
      billing.updateOrganizationSubscription(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["billing", "subscriptions"] });
      setEditingId(null);
      toast.success("Seat count updated");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const onStartEdit = (subscription: OrganizationSubscription) => {
    setEditingId(subscription.id);
    setEditQuantity(String(subscription.quantity));
  };

  const onSaveQuantity = (subscriptionId: string) => {
    const quantity = Number.parseInt(editQuantity, 10);
    if (!Number.isFinite(quantity) || quantity < 1) {
      toast.error("Seat count must be a positive integer");
      return;
    }
    updateMutation.mutate({ subscriptionId, quantity });
  };

  return (
    <SubscriptionsListView
      loading={listQuery.isLoading}
      errorMessage={listQuery.isError ? listQuery.error.message : undefined}
      subscriptions={listQuery.data ?? []}
      editingId={editingId}
      editQuantity={editQuantity}
      onEditQuantityChange={setEditQuantity}
      onStartEdit={onStartEdit}
      onCancelEdit={() => setEditingId(null)}
      onSaveQuantity={onSaveQuantity}
      saving={updateMutation.isPending}
    />
  );
}
