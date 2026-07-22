import { createFileRoute } from "@tanstack/react-router";

import { requireOrgPermission } from "@/auth/require-permission";
import { SeatsPanel } from "@/domains/seats/seats-panel";

export const Route = createFileRoute("/_protected/org/seats")({
  beforeLoad: async ({ context }) => {
    await requireOrgPermission(context.authClient, { seat: ["view"] });
  },
  component: SeatsPanel,
});
