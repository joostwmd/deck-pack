import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { ORGANIZATION_ROLES } from "@deck-pack/auth/rbac";
import { isOrganizationRoleName } from "@deck-pack/auth/rbac";

import { OrgSidebar } from "@/components/org-sidebar";
import { PortalAppShell } from "@/components/portal-app-shell";
import { workspaceFromSession } from "@/config/portal-nav";
import { trpcClient } from "@/utils/trpc";

export const Route = createFileRoute("/_protected/org")({
  beforeLoad: async ({ context }) => {
    const orgId = context.session.data?.session?.activeOrganizationId;
    if (!orgId) {
      redirect({ to: "/solo/account", throw: true });
    }

    const roleResult = await context.authClient.organization.getActiveMemberRole();
    const role = roleResult.data?.role;
    if (role && isOrganizationRoleName(role) && role === ORGANIZATION_ROLES.addinUser) {
      redirect({ to: "/solo/account", search: { addinOnly: true }, throw: true });
    }

    let workspace = workspaceFromSession(context.session.data?.session);
    const profile = await trpcClient.members.getOrganizationProfile.query();
    workspace = profile.workspace ?? workspace;

    if (workspace !== "team") {
      redirect({ to: "/solo/home", throw: true });
    }

    return { activeOrganizationId: orgId, workspace: "team" as const };
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
