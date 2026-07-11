import { createFileRoute } from "@tanstack/react-router";

import { WebLayout } from "@/features/layouts/web-layout";

export const Route = createFileRoute("/_protected/web")({
  component: WebComponent,
});

function WebComponent() {
  return <WebLayout />;
}
