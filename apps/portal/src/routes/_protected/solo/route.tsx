import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { SoloSidebar } from "@/components/solo-sidebar";
import { PortalAppShell } from "@/components/portal-app-shell";
import { workspaceFromSession } from "@/config/portal-nav";
import { trpcClient } from "@/utils/trpc";

export const Route = createFileRoute("/_protected/solo")({
  beforeLoad: async ({ context, location }) => {
    const orgId = context.session.data?.session?.activeOrganizationId;
    const isAccountPath = location.pathname.endsWith("/account");

    if (!orgId && !isAccountPath) {
      redirect({ to: "/solo/account", throw: true });
    }

    let workspace = workspaceFromSession(context.session.data?.session);
    if (orgId) {
      const profile = await trpcClient.members.getOrganizationProfile.query();
      workspace = profile.workspace ?? workspace;
    }

    // Team users may open account; all other solo routes are solo-only.
    if (workspace === "team" && !isAccountPath) {
      redirect({ to: "/org/dashboard", throw: true });
    }

    return {
      activeOrganizationId: orgId ?? null,
      workspace: workspace ?? ("solo" as const),
    };
  },
  component: Layout,
});

function Layout() {
  return (
    <PortalAppShell sidebar={<SoloSidebar />}>
      <Outlet />
    </PortalAppShell>
  );
}
