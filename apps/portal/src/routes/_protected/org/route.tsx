import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { ORGANIZATION_ROLES } from "@deck-pack/auth/rbac";
import { isOrganizationRoleName } from "@deck-pack/auth/rbac";

import { OrgSidebar } from "@/components/org-sidebar";
import { PortalAppShell } from "@/components/portal-app-shell";

export const Route = createFileRoute("/_protected/org")({
  beforeLoad: async ({ context }) => {
    const orgId = context.session.data?.session?.activeOrganizationId;
    if (!orgId) {
      redirect({ to: "/account", throw: true });
    }

    const roleResult = await context.authClient.organization.getActiveMemberRole();
    const role = roleResult.data?.role;
    if (role && isOrganizationRoleName(role) && role === ORGANIZATION_ROLES.addinUser) {
      redirect({ to: "/account", search: { addinOnly: true }, throw: true });
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
