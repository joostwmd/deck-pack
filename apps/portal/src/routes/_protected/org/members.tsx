import { createFileRoute } from "@tanstack/react-router";

import { requireOrgPermission } from "@/auth/require-permission";
import { MembersPanel } from "@/features/members/members-panel";

export const Route = createFileRoute("/_protected/org/members")({
  beforeLoad: async ({ context }) => {
    await requireOrgPermission(context.authClient, { member: ["create"] });
  },
  component: MembersPanel,
});
