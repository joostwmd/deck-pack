import { getRouteApi } from "@tanstack/react-router";

import { useOrganizationProfile } from "@deck-pack/hooks/billing";

import { SoloHomeView } from "@/pages/solo-home/solo-home-view";
import { useServices } from "@/services/services-context";

const homeRoute = getRouteApi("/_protected/solo/home");

export function SoloHomePanel() {
  const { session } = homeRoute.useRouteContext();
  const { billing } = useServices();
  const profileQuery = useOrganizationProfile(billing);

  return (
    <SoloHomeView
      email={session.data?.user.email}
      planName={profileQuery.data?.plan?.name}
      planSlug={profileQuery.data?.plan?.slug}
      seatQuantity={profileQuery.data?.plan?.quantity}
      isBillingLoading={profileQuery.isLoading}
      billingErrorMessage={profileQuery.isError ? profileQuery.error.message : null}
    />
  );
}
