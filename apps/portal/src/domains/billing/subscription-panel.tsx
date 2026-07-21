import { getRouteApi } from "@tanstack/react-router";

import { useOrganizationProfile } from "@deck-pack/hooks/billing";
import { SubscriptionProfileView } from "@deck-pack/ui/components/billing/subscription-profile-view";

import { PortalPageShell } from "@/components/portal-page-shell";
import { useServices } from "@/services/services-context";

const subscriptionRoute = getRouteApi("/_protected/solo/subscription");

export function SubscriptionPanel() {
  const { session } = subscriptionRoute.useRouteContext();
  const { billing } = useServices();
  const profileQuery = useOrganizationProfile(billing);

  return (
    <PortalPageShell
      title="Subscription"
      description={`${session.data?.user.email ?? "—"} · solo workspace`}
    >
      <SubscriptionProfileView
        planName={profileQuery.data?.plan?.name}
        planSlug={profileQuery.data?.plan?.slug}
        seatQuantity={profileQuery.data?.plan?.quantity}
        isLoading={profileQuery.isLoading}
        errorMessage={profileQuery.isError ? profileQuery.error.message : null}
      />
    </PortalPageShell>
  );
}
