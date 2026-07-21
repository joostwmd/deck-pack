import { getRouteApi } from "@tanstack/react-router";

import { AccountView } from "@/features/account/account-view";

const accountRoute = getRouteApi("/_protected/solo/account");

export function AccountPanel() {
  const { session } = accountRoute.useRouteContext();
  const { addinOnly } = accountRoute.useSearch();

  return <AccountView email={session.data?.user.email} addinOnly={addinOnly === true} />;
}
