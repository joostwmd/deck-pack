import { createFileRoute } from "@tanstack/react-router";

import { SubscriptionsPage } from "@/features/plans/subscriptions-page";

export const Route = createFileRoute("/_protected/plans/subscriptions")({
  component: SubscriptionsPage,
});
