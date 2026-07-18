import { OpsPageShell } from "@/components/ops-page-shell";

export function SubscriptionsPage() {
  return (
    <OpsPageShell
      title="Subscriptions"
      description="View and manage active user subscriptions, seat assignments, and usage"
    >
      <div className="text-muted-foreground rounded-lg border border-dashed px-4 py-12 text-center text-sm">
        Subscription management is coming next — assign plans to users, track usage periods,
        and manage org seat inventory.
      </div>
    </OpsPageShell>
  );
}
