import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { OrgSidebar } from "@/components/org-sidebar";
import { PortalAppShell } from "@/components/portal-app-shell";

export const Route = createFileRoute("/_protected/org")({
  beforeLoad: ({ context }) => {
    const orgId = context.session.data?.session?.activeOrganizationId;
    if (!orgId) {
      redirect({ to: "/account", throw: true });
    }
    return { activeOrganizationId: orgId };
  },
  component: Layout,
});

function Layout() {
  return (
    <PortalAppShell sidebar={<OrgSidebar />}>
      <Outlet />
    </PortalAppShell>
  );
}
