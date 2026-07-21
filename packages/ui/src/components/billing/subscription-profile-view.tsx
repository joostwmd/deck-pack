export type SubscriptionProfileViewProps = {
  planName?: string | null;
  planSlug?: string | null;
  seatQuantity?: number | null;
  isLoading?: boolean;
  errorMessage?: string | null;
};

export function SubscriptionProfileView({
  planName,
  planSlug,
  seatQuantity,
  isLoading,
  errorMessage,
}: SubscriptionProfileViewProps) {
  if (isLoading) {
    return <p className="text-muted-foreground text-sm">Loading subscription…</p>;
  }

  if (errorMessage) {
    return <p className="text-destructive text-sm">{errorMessage}</p>;
  }

  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <div>
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Plan</p>
        <p className="text-base font-medium">{planName ?? "No active plan"}</p>
        {planSlug ? <p className="text-muted-foreground text-sm">Slug: {planSlug}</p> : null}
      </div>
      <div>
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Seats</p>
        <p className="text-base font-medium">{seatQuantity != null ? seatQuantity : "—"}</p>
      </div>
      <p className="text-muted-foreground text-sm">
        Solo workspaces include a personal Free plan. Team features (members, seats, and internal
        library) become available when Ops converts this workspace to a team.
      </p>
    </div>
  );
}
