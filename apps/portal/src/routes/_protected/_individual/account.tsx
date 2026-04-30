import { createFileRoute } from "@tanstack/react-router";

import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/_protected/_individual/account")({
  component: AccountPage,
});

function AccountPage() {
  const { session } = Route.useRouteContext();
  const privateData = useQuery(trpc.privateData.queryOptions());

  return (
    <div className="space-y-2">
      <h1 className="text-xl font-semibold">Account</h1>
      <p className="text-muted-foreground">{session.data?.user.email} · individual workspace</p>
      {privateData.data && <p className="text-sm">API: {privateData.data.message}</p>}
    </div>
  );
}
