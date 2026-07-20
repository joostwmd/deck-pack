import { useQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";

import { AccountView } from "@/features/account/account-view";
import { trpc } from "@/utils/trpc";

const accountRoute = getRouteApi("/_protected/solo/account");

export function AccountPanel() {
  const { session } = accountRoute.useRouteContext();
  const { addinOnly } = accountRoute.useSearch();
  const privateData = useQuery(trpc.privateData.queryOptions());

  return (
    <AccountView
      email={session.data?.user.email}
      apiMessage={privateData.data?.message}
      addinOnly={addinOnly === true}
    />
  );
}
