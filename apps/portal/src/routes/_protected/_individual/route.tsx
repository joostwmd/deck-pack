import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected/_individual")({
  beforeLoad: ({ context }) => {
    const orgId = context.session.data?.session?.activeOrganizationId;
    if (orgId) {
      redirect({ to: "/org/dashboard", throw: true });
    }
  },
  component: () => <Outlet />,
});
