import { createFileRoute } from "@tanstack/react-router";

import { ThemesPanel } from "@/features/themes/themes-panel";
import { toAssetPanelMode } from "@/lib/route-environment";

export const Route = createFileRoute("/_protected/$environment/themes")({
  component: ThemesPage,
});

function ThemesPage() {
  const { environment } = Route.useParams();

  return <ThemesPanel mode={toAssetPanelMode(environment)} />;
}
