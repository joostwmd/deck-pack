import { createFileRoute } from "@tanstack/react-router";

import { FormatPanel } from "@/features/format/format-panel";
import { toAssetPanelMode } from "@/lib/route-environment";

export const Route = createFileRoute("/_protected/$environment/format")({
  component: FormatPage,
});

function FormatPage() {
  const { environment } = Route.useParams();

  return <FormatPanel mode={toAssetPanelMode(environment)} />;
}
