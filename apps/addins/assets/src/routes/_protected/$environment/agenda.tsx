import { createFileRoute } from "@tanstack/react-router";

import { PlaceholderPage } from "@/features/placeholder-page";

export const Route = createFileRoute("/_protected/$environment/agenda")({
  component: AgendaPage,
});

function AgendaPage() {
  return (
    <PlaceholderPage
      title="Agenda"
      description="Build and manage presentation agendas from your slide content."
    />
  );
}
