import { PortalPageShell } from "@/components/portal-page-shell";
import { OrgUsageDashboardPanel } from "@/domains/usage/org-usage-dashboard-panel";

export type OrgDashboardViewProps = {
  activeOrganizationId: string;
  userName?: string | null;
};

export function OrgDashboardView({ activeOrganizationId, userName }: OrgDashboardViewProps) {
  return (
    <PortalPageShell
      title="Dashboard"
      description={
        userName
          ? `Welcome back, ${userName}`
          : `Organization workspace ${activeOrganizationId.slice(0, 8)}…`
      }
    >
      <OrgUsageDashboardPanel />
    </PortalPageShell>
  );
}
