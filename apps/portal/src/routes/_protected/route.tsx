import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import Header from "@/components/header";

export const Route = createFileRoute("/_protected")({
  beforeLoad: async ({ context }) => {
    const session = await context.authClient.getSession();
    if (!session.data) {
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
    <div className="grid min-h-0 grid-rows-[auto_1fr]">
      <Header />
      <div className="min-h-0 overflow-auto p-2">
        <Outlet />
      </div>
    </div>
  );
}
