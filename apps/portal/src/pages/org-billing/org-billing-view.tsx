import { PortalPageShell } from "@/components/portal-page-shell";

export function OrgBillingView() {
  return (
    <PortalPageShell title="Billing" description="Manage your team subscription and invoices.">
      <div className="rounded-lg border border-border p-6">
        <p className="text-base font-medium">Billing coming soon</p>
        <p className="text-muted-foreground mt-1 text-sm">
          Team billing management will appear here. Only organization owners can access this page.
        </p>
      </div>
    </PortalPageShell>
  );
}
