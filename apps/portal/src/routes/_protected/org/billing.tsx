import { createFileRoute } from "@tanstack/react-router";

import { requireOrgPermission } from "@/auth/require-permission";
import { OrgBillingView } from "@/pages/org-billing/org-billing-view";

export const Route = createFileRoute("/_protected/org/billing")({
  beforeLoad: async ({ context }) => {
    await requireOrgPermission(context.authClient, { billing: ["manage"] });
  },
  component: OrgBillingView,
});
