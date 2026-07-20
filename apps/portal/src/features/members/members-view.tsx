import { PortalPageShell } from "@/components/portal-page-shell";

export type MembersViewProps = {
  activeOrganizationId: string;
};

export function MembersView({ activeOrganizationId }: MembersViewProps) {
  return (
    <PortalPageShell title="Members" description={`Org: ${activeOrganizationId}`}>
      <p>Member list (stub) — add team management here.</p>
    </PortalPageShell>
  );
}
