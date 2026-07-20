import { PortalPageShell } from "@/components/portal-page-shell";

export type OrgDashboardViewProps = {
  activeOrganizationId: string;
  userName?: string | null;
  apiMessage?: string;
};

export function OrgDashboardView({
  activeOrganizationId,
  userName,
  apiMessage,
}: OrgDashboardViewProps) {
  return (
    <PortalPageShell
      title="Org dashboard"
      description={`Organization: ${activeOrganizationId}`}
    >
      {userName ? <p>Welcome {userName}</p> : null}
      {apiMessage ? <p className="text-sm">API: {apiMessage}</p> : null}
    </PortalPageShell>
  );
}
