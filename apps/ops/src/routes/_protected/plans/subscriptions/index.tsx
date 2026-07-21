import { createFileRoute } from "@tanstack/react-router";

import { SubscriptionsListPanel } from "@/domains/billing/subscriptions-list-panel";

export const Route = createFileRoute("/_protected/plans/subscriptions/")({
  component: SubscriptionsListPage,
});

function SubscriptionsListPage() {
  return <SubscriptionsListPanel />;
}
