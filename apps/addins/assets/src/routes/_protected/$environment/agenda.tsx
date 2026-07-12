import { createFileRoute } from "@tanstack/react-router";

import { AgendaPanel } from "@/features/agenda/agenda-panel";

export const Route = createFileRoute("/_protected/$environment/agenda")({
  component: AgendaPage,
});

function AgendaPage() {
  return <AgendaPanel />;
}
