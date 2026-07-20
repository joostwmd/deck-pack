import { Loader } from "@deck-pack/ui/components/system/loader";
import { createFileRoute, redirect } from "@tanstack/react-router";

import { portalHomePath, workspaceFromSession } from "@/config/portal-nav";
import { trpcClient } from "@/utils/trpc";

export const Route = createFileRoute("/auth/callback")({
  beforeLoad: async ({ context }) => {
    const session = await context.authClient.getSession();
    if (!session.data) {
      throw redirect({
        to: "/",
      });
    }

    let workspace = workspaceFromSession(session.data.session);
    if (session.data.session?.activeOrganizationId) {
      const profile = await trpcClient.members.getOrganizationProfile.query();
      workspace = profile.workspace ?? workspace;
    }

    throw redirect({
      to: portalHomePath(workspace),
    });
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
