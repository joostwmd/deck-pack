import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { IndividualSidebar } from "@/components/individual-sidebar";
import { PortalAppShell } from "@/components/portal-app-shell";

export const Route = createFileRoute("/_protected/_individual")({
  beforeLoad: ({ context }) => {
    const orgId = context.session.data?.session?.activeOrganizationId;
    if (orgId) {
      redirect({ to: "/org/dashboard", throw: true });
    }
  },
  component: Layout,
});

function Layout() {
  return (
    <PortalAppShell areaLabel="Personal" areaHomeTo="/account" sidebar={<IndividualSidebar />}>
      <Outlet />
    </PortalAppShell>
  );
}
