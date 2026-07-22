import { createFileRoute } from "@tanstack/react-router";

import { SubscriptionDetailPanel } from "@/domains/billing/subscription-detail-panel";

export const Route = createFileRoute("/_protected/plans/subscriptions/$subscriptionId")({
  component: SubscriptionDetailPage,
});

function SubscriptionDetailPage() {
  const { subscriptionId } = Route.useParams();
  return <SubscriptionDetailPanel subscriptionId={subscriptionId} />;
}
