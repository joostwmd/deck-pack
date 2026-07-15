import { createFileRoute } from "@tanstack/react-router";

import { ShapesPanel } from "@/features/shapes/shapes-panel";

export const Route = createFileRoute("/_protected/$environment/shapes")({
  component: ShapesPage,
});

function ShapesPage() {
  return <ShapesPanel />;
}
