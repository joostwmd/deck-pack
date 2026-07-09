import { createFileRoute } from "@tanstack/react-router";

import { LogosPanel } from "@/features/logos/logos-panel";

export const Route = createFileRoute("/web")({
  component: WebComponent,
});

function WebComponent() {
  return <LogosPanel mode="web" />;
}
