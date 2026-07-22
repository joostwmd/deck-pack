import { PortalPageShell } from "@/components/portal-page-shell";
import { UsageStatsPanel } from "@/domains/usage/usage-stats-panel";

export type AccountViewProps = {
  email?: string | null;
  addinOnly?: boolean;
};

export function AccountView({ email, addinOnly }: AccountViewProps) {
  return (
    <PortalPageShell
      title="Account"
      description={
        addinOnly
          ? "Your organization access is through the DeckPack add-in in PowerPoint."
          : `${email ?? "—"} · solo workspace`
      }
    >
      {addinOnly ? (
        <p className="text-muted-foreground text-sm">
          Portal administration is not available for add-in-only users. Open PowerPoint and use the
          DeckPack add-in to get started.
        </p>
      ) : null}
      <UsageStatsPanel title="Your usage" />
    </PortalPageShell>
  );
}
