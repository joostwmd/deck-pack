import { createFileRoute } from "@tanstack/react-router";

import { SlidesPanel } from "@/features/slides/slides-panel";
import { toAssetPanelMode } from "@/lib/route-environment";

export const Route = createFileRoute("/_protected/$environment/slides")({
  component: SlidesPage,
});

function SlidesPage() {
  const { environment } = Route.useParams();

  return <SlidesPanel mode={toAssetPanelMode(environment)} />;
}
