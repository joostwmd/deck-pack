import { createFileRoute } from "@tanstack/react-router";

import { FlagsPanel } from "@/features/flags/flags-panel";

export const Route = createFileRoute("/_protected/$environment/flags")({
  component: FlagsPage,
});

function FlagsPage() {
  return <FlagsPanel />;
}
