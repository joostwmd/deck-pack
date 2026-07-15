import { createFileRoute } from "@tanstack/react-router";

import { LogosPanel } from "@/features/logos/logos-panel";

export const Route = createFileRoute("/_protected/$environment/logos")({
  component: LogosPage,
});

function LogosPage() {
  return <LogosPanel />;
}
