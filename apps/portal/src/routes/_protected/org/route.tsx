import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected/org")({
  beforeLoad: ({ context }) => {
    const orgId = context.session.data?.session?.activeOrganizationId;
    if (!orgId) {
      redirect({ to: "/account", throw: true });
    }
    return { activeOrganizationId: orgId };
  },
  component: () => <Outlet />,
});
