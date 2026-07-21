import { createFileRoute } from "@tanstack/react-router";

import { UsageStatsSection } from "@/features/usage/usage-stats-section";

export const Route = createFileRoute("/_protected/$environment/account")({
  component: AccountPage,
});

function AccountPage() {
  const { session } = Route.useRouteContext();

  return (
    <div className="flex flex-col gap-6 p-4">
      <div>
        <h1 className="text-base font-semibold tracking-tight text-foreground">Account</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your signed-in Deck Pack account.</p>
      </div>

      <div className="rounded-lg border border-border/80 bg-muted/20 px-4 py-3 text-sm">
        <p className="font-medium text-foreground">{session.data?.user.name?.trim() || "Signed in"}</p>
        <p className="mt-1 text-muted-foreground">{session.data?.user.email}</p>
      </div>

      <UsageStatsSection title="Your usage" />
    </div>
  );
}
