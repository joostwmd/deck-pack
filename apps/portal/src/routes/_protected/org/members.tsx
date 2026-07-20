import { createFileRoute } from "@tanstack/react-router";

import { MembersPanel } from "@/features/members/members-panel";

export const Route = createFileRoute("/_protected/org/members")({
  component: MembersPanel,
});
