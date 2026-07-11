import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected")({
  beforeLoad: async ({ context }) => {
    const session = await context.authClient.getSession();
    if (!session.data) {
      redirect({
        to: "/login",
        throw: true,
      });
    }
    return { session };
  },
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex h-full min-h-0 w-full min-w-0">
      <Outlet />
    </div>
  );
}
