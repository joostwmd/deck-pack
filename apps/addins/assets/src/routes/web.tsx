import { createFileRoute } from "@tanstack/react-router";

import { AssetsShell } from "@/features/assets-shell";

export const Route = createFileRoute("/web")({
  component: WebComponent,
});

function WebComponent() {
  return <AssetsShell mode="web" />;
}
