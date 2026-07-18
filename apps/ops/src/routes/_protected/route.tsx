import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { OpsAppShell } from "@/components/ops-app-shell";

export const Route = createFileRoute("/_protected")({
  beforeLoad: async ({ context }) => {
    const sessionResult = await context.authClient.getSession();
    const data = sessionResult.data;
    if (!data) {
      throw redirect({ to: "/" });
    }

    const isAdmin = data.user.role === "admin";
    const isImpersonating = Boolean(
      (data.session as { impersonatedBy?: string | null }).impersonatedBy,
    );

    // Allow impersonating sessions so admins can stop from the account menu.
    if (!isAdmin && !isImpersonating) {
      throw redirect({ to: "/" });
    }

    return { session: data };
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
