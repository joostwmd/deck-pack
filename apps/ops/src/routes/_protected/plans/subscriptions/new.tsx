import { createFileRoute } from "@tanstack/react-router";

import { NewSubscriptionPanel } from "@/features/plans/new-subscription-panel";

export const Route = createFileRoute("/_protected/plans/subscriptions/new")({
  component: NewSubscriptionPage,
});

function NewSubscriptionPage() {
  return <NewSubscriptionPanel />;
}
