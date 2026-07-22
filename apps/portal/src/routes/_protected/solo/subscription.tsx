import { createFileRoute } from "@tanstack/react-router";

import { SubscriptionPanel } from "@/domains/billing/subscription-panel";

export const Route = createFileRoute("/_protected/solo/subscription")({
  component: SubscriptionPanel,
});
