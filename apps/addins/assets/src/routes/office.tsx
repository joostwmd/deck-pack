import { createFileRoute } from "@tanstack/react-router";

import { AssetsShell } from "@/features/assets-shell";

export const Route = createFileRoute("/office")({
  component: OfficeComponent,
});

function OfficeComponent() {
  return <AssetsShell mode="office" />;
}
