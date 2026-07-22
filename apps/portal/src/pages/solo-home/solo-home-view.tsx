import { SubscriptionProfileView } from "@deck-pack/ui/components/billing/subscription-profile-view";

import { PortalPageShell } from "@/components/portal-page-shell";
import { UsageStatsPanel } from "@/domains/usage/usage-stats-panel";

export type SoloHomeViewProps = {
  email?: string | null;
  planName?: string | null;
  planSlug?: string | null;
  seatQuantity?: number | null;
  isBillingLoading?: boolean;
  billingErrorMessage?: string | null;
};

export function SoloHomeView({
  email,
  planName,
  planSlug,
  seatQuantity,
  isBillingLoading,
  billingErrorMessage,
}: SoloHomeViewProps) {
  return (
    <PortalPageShell title="Home" description={`${email ?? "—"} · solo workspace`}>
      <div className="flex flex-col gap-8">
        <UsageStatsPanel title="Your usage" />
        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-medium">Billing</h2>
            <p className="text-muted-foreground text-sm">Your current plan and seat allocation.</p>
          </div>
          <SubscriptionProfileView
            planName={planName}
            planSlug={planSlug}
            seatQuantity={seatQuantity}
            isLoading={isBillingLoading}
            errorMessage={billingErrorMessage}
          />
        </section>
      </div>
    </PortalPageShell>
  );
}
