import { createFileRoute } from "@tanstack/react-router";

import { AccountPanel } from "@/features/account/account-panel";

export const Route = createFileRoute("/_protected/_individual/account")({
  component: AccountPanel,
});
