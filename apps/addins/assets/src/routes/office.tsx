import { createFileRoute } from "@tanstack/react-router";

import { LogosPanel } from "@/features/logos/logos-panel";

export const Route = createFileRoute("/office")({
  component: OfficeComponent,
});

function OfficeComponent() {
  return <LogosPanel mode="office" />;
}
