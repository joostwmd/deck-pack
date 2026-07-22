import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { trpcClient } from "@/utils/trpc";

export const Route = createFileRoute("/_protected/org/gallery")({
  beforeLoad: async () => {
    const profile = await trpcClient.members.getOrganizationProfile.query();

    if (profile.type !== "team" && profile.workspace !== "team") {
      redirect({ to: "/org/dashboard", throw: true });
    }
  },
  component: () => <Outlet />,
});
