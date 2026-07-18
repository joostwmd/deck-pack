import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { OpsAppShell } from "@/components/ops-app-shell";

export const Route = createFileRoute("/_protected")({
  beforeLoad: async ({ context }) => {
    const session = await context.authClient.getSession();
    if (!session.data || session.data.user.role !== "admin") {
      redirect({
        to: "/",
        throw: true,
      });
    }
    return { session };
  },
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <OpsAppShell>
      <Outlet />
    </OpsAppShell>
  );
}
