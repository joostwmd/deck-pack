import { createFileRoute } from "@tanstack/react-router";

import { CheckPanel } from "@/features/check/check-panel";

export const Route = createFileRoute("/_protected/$environment/check")({
  component: CheckPage,
});

function CheckPage() {
  return <CheckPanel />;
}
