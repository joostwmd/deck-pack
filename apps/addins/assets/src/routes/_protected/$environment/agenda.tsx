import { createFileRoute } from "@tanstack/react-router";

import { AgendaPanel } from "@/features/agenda/agenda-panel";
import { toAssetPanelMode } from "@/lib/route-environment";

export const Route = createFileRoute("/_protected/$environment/agenda")({
  component: AgendaPage,
});

function AgendaPage() {
  const { environment } = Route.useParams();

  return <AgendaPanel mode={toAssetPanelMode(environment)} />;
}
