import { createFileRoute } from "@tanstack/react-router";

import { UsersPanel } from "@/domains/users/users-panel";

export const Route = createFileRoute("/_protected/users")({
  component: UsersPanel,
});
