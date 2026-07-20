import { useQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";

import { SubscriptionView } from "@/features/subscription/subscription-view";
import { trpc } from "@/utils/trpc";

const subscriptionRoute = getRouteApi("/_protected/solo/subscription");

export function SubscriptionPanel() {
  const { session } = subscriptionRoute.useRouteContext();
  const profileQuery = useQuery(trpc.members.getOrganizationProfile.queryOptions());

  return (
    <SubscriptionView
      email={session.data?.user.email}
      planName={profileQuery.data?.plan?.name}
      planSlug={profileQuery.data?.plan?.slug}
      seatQuantity={profileQuery.data?.plan?.quantity}
      isLoading={profileQuery.isLoading}
      errorMessage={profileQuery.isError ? profileQuery.error.message : null}
    />
  );
}
