import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { restoreOfficeSession } from "@/auth/restore-office-session";
import { ShortcutBindingsProvider } from "@/providers/shortcut-bindings-provider";

export const Route = createFileRoute("/_protected")({
  beforeLoad: async ({ context }) => {
    let session = await context.authClient.getSession();

    if (!session.data) {
      // Office task pane: the persisted bearer token may have expired while the
      // pane was closed. Try a silent NAA re-auth before falling back to login.
      const restored = await restoreOfficeSession(context.authClient);
      if (restored) {
        session = await context.authClient.getSession();
      }
    }

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
    <ShortcutBindingsProvider>
      <div className="flex h-full min-h-0 w-full min-w-0 flex-1">
        <Outlet />
      </div>
    </ShortcutBindingsProvider>
  );
}
