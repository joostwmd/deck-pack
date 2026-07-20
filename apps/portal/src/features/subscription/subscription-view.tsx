import { PortalPageShell } from "@/components/portal-page-shell";

export type SubscriptionViewProps = {
  email?: string | null;
  planName?: string | null;
  planSlug?: string | null;
  seatQuantity?: number | null;
  isLoading?: boolean;
  errorMessage?: string | null;
};

export function SubscriptionView({
  email,
  planName,
  planSlug,
  seatQuantity,
  isLoading,
  errorMessage,
}: SubscriptionViewProps) {
  return (
    <PortalPageShell
      title="Subscription"
      description={`${email ?? "—"} · solo workspace`}
    >
      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading subscription…</p>
      ) : errorMessage ? (
        <p className="text-destructive text-sm">{errorMessage}</p>
      ) : (
        <div className="space-y-3 rounded-lg border border-border p-4">
          <div>
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Plan
            </p>
            <p className="text-base font-medium">{planName ?? "No active plan"}</p>
            {planSlug ? (
              <p className="text-muted-foreground text-sm">Slug: {planSlug}</p>
            ) : null}
          </div>
          <div>
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Seats
            </p>
            <p className="text-base font-medium">
              {seatQuantity != null ? seatQuantity : "—"}
            </p>
          </div>
          <p className="text-muted-foreground text-sm">
            Solo workspaces include a personal Free plan. Team features (members, seats, and
            internal library) become available when Ops converts this workspace to a team.
          </p>
        </div>
      )}
    </PortalPageShell>
  );
}
