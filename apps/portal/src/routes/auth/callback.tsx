import { Loader } from "@deck-pack/ui/components/system/loader";
import { createFileRoute, redirect } from "@tanstack/react-router";

import { resolvePortalPostAuthDestination } from "@/features/join/resolve-portal-post-auth";

export const Route = createFileRoute("/auth/callback")({
  beforeLoad: async ({ context }) => {
    const session = await context.authClient.getSession();
    if (!session.data) {
      throw redirect({
        to: "/",
      });
    }

    throw redirect(await resolvePortalPostAuthDestination());
  },
  component: AuthCallbackComponent,
});

function AuthCallbackComponent() {
  return (
    <div className="flex h-svh w-full items-center justify-center bg-background">
      <Loader />
    </div>
  );
}
