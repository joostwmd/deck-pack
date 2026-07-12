import { createFileRoute } from "@tanstack/react-router";

import { ShapesPanel } from "@/features/shapes/shapes-panel";
import { toAssetPanelMode } from "@/lib/route-environment";

export const Route = createFileRoute("/_protected/$environment/shapes")({
  component: ShapesPage,
});

function ShapesPage() {
  const { environment } = Route.useParams();

  return <ShapesPanel mode={toAssetPanelMode(environment)} />;
}
